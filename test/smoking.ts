import { PuppetRabbit } from '../src/mod.js'

const puppet = new PuppetRabbit({
  token: 'puppet_ttbunny_test',
  mqUri: 'amqp://test:test@127.0.0.1:5672',
})
puppet.start()
