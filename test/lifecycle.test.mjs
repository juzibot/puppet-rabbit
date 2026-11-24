import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const root = pathToFileURL(resolve('dist/esm/src') + '/')
const { PuppetRabbit } = await import(new URL('puppet.js', root))
const { MqManager } = await import(new URL('mq/mq-manager.js', root))
const require = createRequire(root)
const onirii = require('onirii').default
const log = { info () {}, error () {}, warn () {}, verbose () {} }
const minute = 60_000

function puppetWithChannel () {
  const mqManager = new MqManager(log)
  let traceId
  let heartbeats = 0
  let destroys = 0
  mqManager.init = async () => {}
  mqManager.destroy = async () => { destroys++ }
  mqManager.exchangeBaseName = 'test'
  mqManager.puppetChannel = {
    sendMessageToExchange (_exchange, _key, content, options) {
      traceId = JSON.parse(content).traceId
      assert.equal(options.expiration, 10 * minute)
    },
    ackMessage () {},
  }
  const puppet = {
    mqManager, log, options: {},
    startHeartbeat () { heartbeats++ },
  }
  return {
    mqManager, start: () => PuppetRabbit.prototype.onStart.call(puppet),
    traceId: () => traceId, heartbeats: () => heartbeats, destroys: () => destroys,
  }
}

test('local start timeout preserves heartbeat and consumes later login', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const puppet = puppetWithChannel()
  const started = puppet.start()
  await Promise.resolve()
  mock.timers.tick(minute)
  await started
  assert.equal(puppet.heartbeats(), 1)
  assert.equal(puppet.destroys(), 0)
  let login
  puppet.mqManager.on('login', payload => { login = payload })
  await puppet.mqManager.consumption({ content: Buffer.from(JSON.stringify({
    eventType: 'login', data: '{"contactId":"self"}',
  })) }, puppet.mqManager.puppetChannel)
  assert.deepEqual(login, { contactId: 'self' })
})

test('server rejection with timeout-like text is not a local timeout', async () => {
  const puppet = puppetWithChannel()
  const started = puppet.start()
  await Promise.resolve()
  const traceId = puppet.traceId()
  const error = `async start request timeout, traceId: ${traceId}`
  const rejected = assert.rejects(started, { message: error, constructor: Error })
  await puppet.mqManager.consumption({ content: Buffer.from(JSON.stringify({
    type: 'command', code: 1, error, traceId,
  })) }, puppet.mqManager.puppetChannel)
  await rejected
  assert.equal(puppet.heartbeats(), 0)
})

test('destroy suppresses a channel close callback', async () => {
  const mqManager = new MqManager(log)
  let reconnects = 0
  let onClose
  mqManager.puppetChannel = {
    addCloseListener (listener) { onClose = listener },
    close () { onClose() },
  }
  mqManager.reconnectChannel = async () => { reconnects++ }
  await mqManager.prepareChannelListener()
  await mqManager.destroy()
  assert.equal(reconnects, 0)
})

test('channel recovery survives two errors and creates one consumer', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  let attempts = 0
  let consumers = 0
  mqManager.createChannelService = async () => {
    if (++attempts < 3) throw new Error('channel unavailable')
    return {
      addCloseListener () {}, initMetaConfigure () {},
      currentChannelInstance: { async consume () { consumers++ } },
    }
  }
  const recovered = mqManager.reconnectChannel()
  for (const expectedAttempts of [1, 2, 3]) {
    mock.timers.tick(minute)
    await new Promise(setImmediate)
    assert.equal(attempts, expectedAttempts)
  }
  await recovered
  assert.equal(consumers, 1)
})

const options = { token: 'self', exchangeBaseName: 'test', mqUri: 'amqp://unused' }

function fakeTransport () {
  let active = 0
  let created = 0
  let cancelled = 0
  const channel = {
    setPrefetchCount () {}, addCloseListener () {}, initMetaConfigure () {},
    currentChannelInstance: {
      async consume () {
        assert.equal(active++, 0, 'consumer must be unique')
        created++
      },
      async cancel () {
        await new Promise(setImmediate)
        active--
        cancelled++
      },
    },
    async close () { active = 0 },
  }
  const connection = {
    async ready () {}, async killChannel () {}, async close () {},
    addCloseListener () {}, addErrorListener () {},
    async createChannelService () { return channel },
  }
  return { connection, channel, counts: () => [active, created, cancelled] }
}

test('connection recovery retries with capped backoff and waits for consumer cancellation', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  const transport = fakeTransport()
  let attempts = 0
  const names = new Set()
  mqManager.token = options.token
  mqManager.mqUri = options.mqUri
  mqManager.exchangeBaseName = options.exchangeBaseName
  mock.method(onirii, 'createAmqpConnect', (name) => {
    names.add(name)
    const attempt = ++attempts
    return { ...transport.connection, async ready (_init, retry) {
      assert.equal(retry, -1)
      if (attempt <= 6) throw new Error('broker offline')
    } }
  })
  const recovered = mqManager.reconnectMainConnect(new Error('broker offline'), 1)
  await new Promise(setImmediate)
  for (const [index, delay] of [5000, 10_000, 20_000, 40_000, minute, minute].entries()) {
    assert.equal(attempts, index + 1)
    mock.timers.tick(delay - 1)
    await new Promise(setImmediate)
    assert.equal(attempts, index + 1)
    mock.timers.tick(1)
    await new Promise(setImmediate)
  }
  await recovered
  assert.equal(attempts, 7)
  // Onirii keeps a log4js appender per connection name forever
  assert.equal(names.size, 1)
  assert.deepEqual(transport.counts(), [1, 2, 1])
  await mqManager.destroy()
})

test('a previous lifecycle retry cannot replace the channel after an explicit init', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  const transport = fakeTransport()
  let attempts = 0
  mock.method(onirii, 'createAmqpConnect', () => ({
    ...transport.connection,
    async createChannelService () {
      attempts++
      return transport.channel
    },
  }))
  await mqManager.init(options)
  const staleRecovery = mqManager.reconnectChannel()
  await mqManager.destroy()
  await mqManager.init(options)
  mock.timers.tick(minute)
  await staleRecovery
  assert.equal(attempts, 2)
  assert.deepEqual(transport.counts(), [1, 2, 0])
  await mqManager.destroy()
})

test('publish failure is not treated as a start timeout', async () => {
  const puppet = puppetWithChannel()
  const failure = new Error('channel closed during publish')
  puppet.mqManager.puppetChannel.sendMessageToExchange = async () => { throw failure }
  await assert.rejects(puppet.start(), error => error === failure)
  assert.equal(puppet.heartbeats(), 0)
  assert.equal(puppet.mqManager.MqCommandResponsePool.size, 0)
})

test('channel recovery retries a rejected consumer registration', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  let attempts = 0
  mqManager.createChannelService = async () => ({
    addCloseListener () {}, initMetaConfigure () {}, close () {},
    currentChannelInstance: {
      async consume () {
        if (++attempts === 1) throw new Error('consume rejected by broker')
      },
    },
  })
  const recovered = mqManager.reconnectChannel()
  for (const expectedAttempts of [1, 2]) {
    mock.timers.tick(minute)
    await new Promise(setImmediate)
    assert.equal(attempts, expectedAttempts)
  }
  await recovered
})

test('cold start retries until the broker becomes reachable', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  const transport = fakeTransport()
  let attempts = 0
  mock.method(onirii, 'createAmqpConnect', () => ({
    ...transport.connection,
    async ready () {
      if (++attempts === 1) throw new Error('broker offline')
    },
  }))
  const started = mqManager.init(options)
  await new Promise(setImmediate)
  assert.equal(attempts, 1)
  mock.timers.tick(5000)
  await started
  assert.equal(attempts, 2)
  assert.deepEqual(transport.counts(), [1, 1, 0])
  await mqManager.destroy()
})

test('a pending channel retry cannot suppress a new connection channel close', async ({ mock }) => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const mqManager = new MqManager(log)
  const transports = [fakeTransport(), fakeTransport(), fakeTransport()]
  let createdConnections = 0
  let prefetches = 0
  let closeChannel
  mock.method(onirii, 'createAmqpConnect', () => {
    const transport = transports[createdConnections++]
    return {
      ...transport.connection,
      async createChannelService () {
        const channel = prefetches === 2 ? transports[2].channel : transport.channel
        prefetches++
        return { ...channel, addCloseListener (callback) { closeChannel = callback } }
      },
    }
  })
  await mqManager.init(options)
  closeChannel()
  await mqManager.reconnectMainConnect(new Error('connection closed'), 1)
  closeChannel()
  mock.timers.tick(minute)
  await new Promise(setImmediate)
  assert.equal(prefetches, 3)
  assert.deepEqual(transports[2].counts(), [1, 1, 0])
  await mqManager.destroy()
})

function puppetWithRoomMemberResponse (roomMemberV2, response) {
  const mqManager = new MqManager(log)
  const published = []
  mqManager.exchangeBaseName = 'test'
  const channel = {
    async sendMessageToExchange (_exchange, _key, content) {
      const { traceId, commandType, data } = JSON.parse(content)
      published.push({ commandType, data: JSON.parse(data) })
      const result = response instanceof Error
        ? { code: 1, error: response.message }
        : { data: JSON.stringify(response) }
      await mqManager.consumption({ content: Buffer.from(JSON.stringify({
        traceId, type: 'command', ...result,
      })) }, channel)
    },
    ackMessage () {},
  }
  mqManager.puppetChannel = channel
  return { puppet: { mqManager, options: { roomMemberV2 } }, published }
}

test('room member V2 falls back without publishing when not explicitly enabled', async () => {
  for (const roomMemberV2 of [undefined, false]) {
    const { puppet, published } = puppetWithRoomMemberResponse(roomMemberV2, {})
    for (const method of ['roomAddV2', 'roomDelV2']) {
      await assert.rejects(async () => {
        await PuppetRabbit.prototype[method].call(puppet, 'room', ['a', 'b'])
      }, { message: `${method} is not a function` })
    }
    assert.deepEqual(published, [])
  }
})

test('room member V2 publishes one batch command per operation and returns partial success', async () => {
  const response = { successList: ['a'], failList: ['b'], failReasonList: ['not permitted'] }
  const { puppet, published } = puppetWithRoomMemberResponse(true, response)
  const roomId = 'room'
  const contactIds = ['a', 'b']
  const quoteIds = ['quote']
  assert.deepEqual(await PuppetRabbit.prototype.roomAddV2.call(puppet, roomId, contactIds, false, quoteIds), response)
  assert.deepEqual(await PuppetRabbit.prototype.roomDelV2.call(puppet, roomId, contactIds), response)
  assert.deepEqual(published, [
    { commandType: 'roomAddV2', data: { roomId, contactIds, inviteOnly: false, quoteIds } },
    { commandType: 'roomDelV2', data: { roomId, contactIds } },
  ])
})

test('room member V2 rejects invalid response fields and mismatched failure lists', async () => {
  const empty = { successList: [], failList: [], failReasonList: [] }
  for (const response of [
    null,
    {},
    { ...empty, successList: [1] },
    { ...empty, failList: [1], failReasonList: ['denied'] },
    { ...empty, failList: ['a'], failReasonList: [null] },
    { ...empty, failList: ['a'] },
  ]) {
    const { puppet } = puppetWithRoomMemberResponse(true, response)
    await assert.rejects(PuppetRabbit.prototype.roomAddV2.call(puppet, 'room', ['a']), /Invalid roomAddV2 response/)
    await assert.rejects(PuppetRabbit.prototype.roomDelV2.call(puppet, 'room', ['a']), /Invalid roomDelV2 response/)
  }
})

test('room member V2 preserves the MQ error cause without exposing fallback markers', async ({ mock }) => {
  const markers = ['is not a function', 'The server does not implement the method']
  const serverError = new Error(`helper ${markers[0]}; ${markers[1]}`)
  const { puppet, published } = puppetWithRoomMemberResponse(true, serverError)
  const sendMqCommand = puppet.mqManager.sendMqCommand.bind(puppet.mqManager)
  let originalError
  mock.method(puppet.mqManager, 'sendMqCommand', async (command) => {
    try {
      return await sendMqCommand(command)
    } catch (error) {
      originalError = error
      throw error
    }
  })

  for (const method of ['roomAddV2', 'roomDelV2']) {
    await assert.rejects(PuppetRabbit.prototype[method].call(puppet, 'room', ['a']), (error) => {
      assert.equal(error.constructor, Error)
      assert.notEqual(error, originalError)
      assert.equal(error.cause, originalError)
      assert.equal(error.cause.message, serverError.message)
      for (const marker of markers) {
        assert.equal(error.message.includes(marker), false)
      }
      return true
    })
  }
  assert.deepEqual(published.map(({ commandType }) => commandType), ['roomAddV2', 'roomDelV2'])
})
