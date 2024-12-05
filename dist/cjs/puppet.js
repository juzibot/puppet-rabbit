"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppetRabbit = void 0;
const PUPPET = __importStar(require("@juzi/wechaty-puppet"));
const mq_manager_js_1 = require("./mq/mq-manager.js");
const wechaty_puppet_1 = require("@juzi/wechaty-puppet");
const mq_js_1 = require("./model/mq.js");
const file_box_1 = require("file-box");
const PRE = 'PuppetRabbit';
class PuppetRabbit extends PUPPET.Puppet {
    options;
    mqManager = mq_manager_js_1.MqManager.Instance;
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
        wechaty_puppet_1.log.verbose(PRE, 'onStart()');
        await this.mqManager.init(this.options.token, this.options.mqUri);
        this.initEvents();
        await this.mqManager.sendToServer({
            commandType: mq_js_1.MqCommandType.start,
            data: '{}',
        });
    }
    async onStop() {
        wechaty_puppet_1.log.verbose(PRE, 'onStop()');
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
            commandType: mq_js_1.MqCommandType.contactPayload,
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
        return file_box_1.FileBox.fromUrl(contactPayload.avatar);
    }
    async dirtyPayload(type, id) {
        await this.mqManager.sendToServer({
            commandType: mq_js_1.MqCommandType.dirtyPayload,
            data: JSON.stringify({
                type,
                id,
            }),
        });
    }
    async postSearch(filter, pagination) {
        const data = await this.mqManager.sendToServer({
            commandType: mq_js_1.MqCommandType.postSearch,
            data: JSON.stringify({
                filter,
                pagination,
            }),
        });
        return data;
    }
    async postRawPayload(id) {
        const data = await this.mqManager.sendToServer({
            commandType: mq_js_1.MqCommandType.postPayload,
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
            commandType: mq_js_1.MqCommandType.postPayloadSayable,
            data: JSON.stringify({
                postId,
                sayableId,
            }),
        });
        return data;
    }
    async postPublish(payload) {
        const data = await this.mqManager.sendToServer({
            commandType: mq_js_1.MqCommandType.postPublish,
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
exports.PuppetRabbit = PuppetRabbit;
exports.default = PuppetRabbit;
//# sourceMappingURL=puppet.js.map