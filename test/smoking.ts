import { PuppetRabbit } from '../src/mod.js'
import * as PUPPET from '@juzi/wechaty-puppet'

const puppet = new PuppetRabbit({
  token: 'puppet_ttbunny_test',
  mqUri: '',
})

puppet.on('login', onLogin).on('loginUrl', onLoginUrl)

puppet.start()

async function onLoginUrl(payload: PUPPET.payloads.EventLoginUrl) {
  console.info(`login url: ${payload.url}`)
}

async function onLogin(payload: PUPPET.payloads.EventLogin) {
  console.info(`${payload.contactId} login`)

  const contactPayload = await puppet.contactPayload(payload.contactId)
  console.info(`contact payload: ${JSON.stringify(contactPayload)}`)

  const pagination = {} as any
  const list: string[] = []
  while (true) {
    const response = await puppet.postSearch({}, pagination)
    list.push(...response.response)
    if (!response.nextPageToken) {
      break
    } else {
      pagination.pageToken = response.nextPageToken
    }
  }
  console.log(list)
  const postPayload = await puppet.postPayload(list[0])
  console.log(postPayload)
}
