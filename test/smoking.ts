import { PuppetRabbit } from '../src/mod.js'

const puppet = new PuppetRabbit({
  token: 'puppet_ttbunny_test',
  mqUri: '',
})
puppet.start()
