import * as PUPPET from '@juzi/wechaty-puppet'
import { MqManager } from './mq/mq-manager.js'
import { log } from '@juzi/wechaty-puppet'
import { MqCommandType } from './model/mq.js'
import { v4 } from 'uuid'

export type PuppetRabbitOptions = PUPPET.PuppetOptions & {
  mqUri?: string
  token?: string
}

const PRE = 'PuppetRabbit'

class PuppetRabbit extends PUPPET.Puppet {
  private readonly mqManager = MqManager.Instance

  constructor(public override options: PuppetRabbitOptions = {}) {
    super(options)
    if (!options.mqUri || !options.token) {
      throw new Error(`PuppetRabbit need mqUri and token`)
    }
  }

  override name() {
    return 'wechaty-puppet-rabbit'
  }

  override version() {
    return '0.0.0'
  }

  override async onStart(): Promise<void> {
    log.verbose(PRE, 'onStart()')
    await this.mqManager.init(this.options.token, this.options.mqUri)
    this.mqManager.sendToServer({
      commandType: MqCommandType.start,
      data: '{}',
      traceId: v4(),
    })
  }

  override async onStop(): Promise<void> {
    log.verbose(PRE, 'onStop()')
  }
}

export { PuppetRabbit }

export default PuppetRabbit
