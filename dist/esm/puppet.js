import * as PUPPET from '@juzi/wechaty-puppet';
import { MqManager } from './mq/mq-manager.js';
import { log } from '@juzi/wechaty-puppet';
import { MqCommandType } from './model/mq.js';
import { FileBox } from 'file-box';
const PRE = 'PuppetRabbit';
class PuppetRabbit extends PUPPET.Puppet {
    options;
    mqManager = MqManager.Instance;
    constructor(options = {}) {
        super(options);
        this.options = options;
        if (!options.mqUri || !options.token) {
            throw new Error(`PuppetRabbit need mqUri and token`);
        }
    }
    name() {
        return 'wechaty-puppet-rabbit';
    }
    version() {
        return '0.0.0';
    }
    async onStart() {
        log.verbose(PRE, 'onStart()');
        await this.mqManager.init(this.options.token, this.options.mqUri);
        this.initEvents();
        await this.mqManager.sendToServer({
            commandType: MqCommandType.start,
            data: '{}',
        });
    }
    async onStop() {
        log.verbose(PRE, 'onStop()');
    }
    async contactList() {
        return [];
    }
    async roomList() {
        return [];
    }
    async contactRawPayload(id) {
        // TODO: add local cache
        const data = await this.mqManager.sendToServer({
            commandType: MqCommandType.contactPayload,
            data: JSON.stringify({
                id,
            }),
        });
        return data;
    }
    async contactRawPayloadParser(payload) {
        return payload;
    }
    async contactAvatar(contactId, fileBox) {
        if (fileBox) {
            throw new Error('not supported');
        }
        const contactPayload = await this.contactPayload(contactId);
        return FileBox.fromUrl(contactPayload.avatar);
    }
    async dirtyPayload(type, id) {
        await this.mqManager.sendToServer({
            commandType: MqCommandType.dirtyPayload,
            data: JSON.stringify({
                type,
                id,
            }),
        });
    }
    async postSearch(filter, pagination) {
        const data = await this.mqManager.sendToServer({
            commandType: MqCommandType.postSearch,
            data: JSON.stringify({
                filter,
                pagination,
            }),
        });
        return data;
    }
    async postRawPayload(id) {
        const data = await this.mqManager.sendToServer({
            commandType: MqCommandType.postPayload,
            data: JSON.stringify({
                id,
            }),
        });
        return data;
    }
    async postRawPayloadParser(payload) {
        return payload;
    }
    async postPayloadSayable(postId, sayableId) {
        const data = await this.mqManager.sendToServer({
            commandType: MqCommandType.postPayloadSayable,
            data: JSON.stringify({
                postId,
                sayableId,
            }),
        });
        return data;
    }
    async postPublish(payload) {
        const data = await this.mqManager.sendToServer({
            commandType: MqCommandType.postPublish,
            data: JSON.stringify(payload),
        });
        return data.postId;
    }
    initEvents() {
        this.mqManager
            .on('dong', (data) => {
            this.emit('dong', data);
        })
            .on('login', (data) => {
            this.emit('login', data);
        });
    }
    removeEvents() {
        this.mqManager.removeAllListeners();
    }
}
export { PuppetRabbit };
export default PuppetRabbit;
//# sourceMappingURL=puppet.js.map