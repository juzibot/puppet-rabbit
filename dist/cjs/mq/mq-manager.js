"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqManager = void 0;
const wechaty_puppet_1 = require("@juzi/wechaty-puppet");
const onirii_1 = __importDefault(require("onirii"));
const time_js_1 = require("../util/time.js");
const mq_js_1 = require("../model/mq.js");
const events_1 = __importDefault(require("events"));
const config_js_1 = require("./config.js");
const uuid_1 = require("uuid");
const PRE = 'MqManager';
var LISTENER_TYPE;
(function (LISTENER_TYPE) {
    LISTENER_TYPE[LISTENER_TYPE["ERROR"] = 0] = "ERROR";
    LISTENER_TYPE[LISTENER_TYPE["CLOSE"] = 1] = "CLOSE";
})(LISTENER_TYPE || (LISTENER_TYPE = {}));
class MqManager extends events_1.default {
    static _instance;
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    puppetConnection;
    puppetChannel;
    connected = false;
    restartingConnection = false;
    restartingChannel = false;
    token;
    static MqCommandResponsePool = new Map();
    static async consumption(msg, channel) {
        wechaty_puppet_1.log.info(PRE, `consuming content: ${msg?.content.toString()}`);
        const messageString = msg?.content.toString();
        if (!messageString) {
            await channel?.ackMessage(msg);
            return;
        }
        try {
            const message = JSON.parse(messageString);
            if (message.type === mq_js_1.MqMessageType.command) {
                const waiter = this.MqCommandResponsePool.get(message.traceId);
                if (!waiter) {
                    wechaty_puppet_1.log.warn(PRE, `MqCommandResponsePool Not Found ${message.traceId}`);
                    await channel?.ackMessage(msg);
                    return;
                }
                if (message.code) {
                    waiter.rejector(new Error(message.error));
                }
                else {
                    waiter.resolver(JSON.parse(message.data));
                }
                clearTimeout(waiter.timer);
            }
            else {
                this.Instance.handleEvent(message.eventType, message.data);
            }
        }
        catch (e) {
            wechaty_puppet_1.log.error(PRE, `consumption() error: ${e.stack}`);
        }
        await channel?.ackMessage(msg);
    }
    async init(token, mqUri) {
        wechaty_puppet_1.log.info(PRE, `init(${token})`);
        if (!this.puppetConnection) {
            if (!(token && mqUri)) {
                throw new Error(`init() need token and mqUri`);
            }
            // no idea why have to add default
            this.puppetConnection = onirii_1.default.default.createAmqpConnect(`puppet-${token}-${Date.now()}`, mqUri);
            this.token = token;
        }
        await this.initConnect();
        this.connected = true;
        await this.initChannel();
        await this.startConsumer();
    }
    async initConnect() {
        wechaty_puppet_1.log.info(PRE, 'initConnect()');
        await this.puppetConnection.ready();
        await this.prepareConnectListener();
        wechaty_puppet_1.log.info(PRE, 'initConnect() connected mq service...');
    }
    async initChannel() {
        wechaty_puppet_1.log.info(PRE, 'initChannel()');
        this.puppetChannel = await this.createChannelService(10);
        await this.prepareChannelListener();
        await this.prepareQueue(this.puppetChannel);
    }
    async prepareConnectListener() {
        this.puppetConnection?.addCloseListener((err) => void this.reconnectMainConnect(err, LISTENER_TYPE.CLOSE));
        this.puppetConnection?.addErrorListener((err) => void this.reconnectMainConnect(err, LISTENER_TYPE.ERROR));
    }
    async createChannelService(prefetch) {
        wechaty_puppet_1.log.info(PRE, 'Creating Channel ...');
        const instance = await this.puppetConnection?.createChannelService(false);
        if (instance) {
            await instance.setPrefetchCount(prefetch);
            return instance;
        }
        else {
            throw new Error(`Cant Create Amqp Channel Instance`);
        }
    }
    async prepareChannelListener() {
        this.puppetChannel?.addCloseListener(() => {
            wechaty_puppet_1.log.info(`puppetChannel on close listener`);
            void this.reconnectChannel();
        });
    }
    async reconnectMainConnect(err, type) {
        wechaty_puppet_1.log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]})`);
        this.connected = false;
        if (this.restartingConnection) {
            wechaty_puppet_1.log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) under processing...`);
            return;
        }
        this.restartingConnection = true;
        wechaty_puppet_1.log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) MQ Service Connect Receive ${LISTENER_TYPE[type]} event: ${err}`);
        try {
            await this.init();
            await this.startConsume();
        }
        catch (e) {
            wechaty_puppet_1.log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type] || type}) Reconnect MQ Service Failed: ${e}`);
            void this.reconnectMainConnect(e, type);
        }
        finally {
            this.restartingConnection = false;
        }
        wechaty_puppet_1.log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) Reconnected MQ Service Done.`);
    }
    async reconnectChannel() {
        wechaty_puppet_1.log.info(PRE, `reconnectChannel()`);
        if (this.restartingConnection) {
            wechaty_puppet_1.log.error(PRE, `reconnectChannel() restart connect under processing...`);
            return;
        }
        if (this.restartingChannel) {
            wechaty_puppet_1.log.error(PRE, `reconnectChannel(}) restart channel under processing...`);
            return;
        }
        this.restartingChannel = true;
        wechaty_puppet_1.log.error(PRE, `reconnectChannel(}) MQ Service Channel Connect Receive Close event.`);
        try {
            await (0, time_js_1.sleep)(time_js_1.MINUTE);
            this.puppetChannel = await this.createChannelService(10);
            await this.startConsumer();
        }
        catch (e) {
            wechaty_puppet_1.log.error(PRE, `reconnectChannel(}) Reconnect MQ Service Failed: ${e}`);
            return this.reconnectChannel();
        }
        finally {
            this.restartingChannel = false;
        }
        wechaty_puppet_1.log.info(PRE, `reconnectChannel(}) Reconnected MQ Service Done.`);
    }
    async startConsume() {
        while (true) {
            if (this.connected) {
                break;
            }
            wechaty_puppet_1.log.warn(PRE, 'startConsume() MQ Server Connect Not Ready Yet');
            await (0, time_js_1.sleep)(5 * time_js_1.SECOND);
        }
        await this.stopConsume();
        wechaty_puppet_1.log.info(PRE, 'startConsume() Creating Consumer ...');
        await this.startConsumer();
    }
    async stopConsume() {
        wechaty_puppet_1.log.info(PRE, 'stopConsume() Stopping Consumer ...');
        this.puppetChannel?.killConsume('puppetConsumer');
    }
    async startConsumer() {
        wechaty_puppet_1.log.info(PRE, 'startConsumer()');
        this.puppetChannel?.consume((0, config_js_1.getTokenQueueName)(this.token), (msg) => void MqManager.consumption(msg, this.puppetChannel), {
            consumerTag: 'puppetConsumer',
        });
    }
    async sendToServer(message) {
        if (!message.traceId) {
            message.traceId = (0, uuid_1.v4)();
        }
        wechaty_puppet_1.log.info(PRE, `sendToServer(${JSON.stringify(message)})`);
        this.puppetChannel?.sendMessageToExchange('tiktok.message.to.server', 'command', Buffer.from(JSON.stringify(message)), {
            timestamp: Date.now(),
            appId: this.token,
            expiration: 10 * time_js_1.MINUTE,
        });
        return new Promise((resolve, reject) => {
            const waiter = {
                resolver: resolve,
                rejector: reject,
                traceId: message.traceId,
                timer: setTimeout(() => {
                    reject(new Error(`async request timeout, traceId: ${message.traceId}`));
                }, 1 * time_js_1.MINUTE),
            };
            MqManager.MqCommandResponsePool.set(message.traceId, waiter);
        })
            .then((data) => {
            wechaty_puppet_1.log.info(PRE, `handleResponse(${JSON.stringify(data)})`);
            return data;
        })
            .finally(() => {
            const waiterInPool = MqManager.MqCommandResponsePool.get(message.traceId);
            if (waiterInPool) {
                clearTimeout(waiterInPool.timer);
                MqManager.MqCommandResponsePool.delete(message.traceId);
            }
        });
    }
    handleEvent(eventType, data) {
        wechaty_puppet_1.log.info(PRE, `handleEvent(${eventType}, ${data})`);
        switch (eventType) {
            case mq_js_1.MqEventType.dong:
                this.emit('dong', JSON.parse(data));
                break;
            case mq_js_1.MqEventType.login:
                this.emit('login', JSON.parse(data));
                break;
            case mq_js_1.MqEventType.postComment:
                this.emit('postComment', JSON.parse(data));
                break;
            case mq_js_1.MqEventType.loginUrl:
                this.emit('loginUrl', JSON.parse(data));
                break;
            case mq_js_1.MqEventType.dirty:
                this.emit('dirty', JSON.parse(data));
                break;
            case mq_js_1.MqEventType.logout:
                this.emit('logout', JSON.parse(data));
                break;
            default:
                wechaty_puppet_1.log.warn(PRE, `handleEvent(${eventType}, ${data}) Not Support`);
        }
    }
    async prepareQueue(channel) {
        if (!channel) {
            wechaty_puppet_1.log.warn(PRE, `prepare() need channel`);
            return;
        }
        await channel.initMetaConfigure({
            queueList: [
                {
                    name: (0, config_js_1.getTokenQueueName)(this.token),
                    options: {
                        arguments: Object({
                            'x-queue-type': 'quorum',
                        }),
                    },
                },
            ],
            exchangeList: [
                {
                    name: config_js_1.ServerExchangeName,
                    type: 'direct',
                    options: {
                        arguments: Object({
                            'x-queue-type': 'quorum',
                        }),
                    },
                },
                {
                    name: config_js_1.ClientExchangeName,
                    type: 'direct',
                    options: {
                        arguments: Object({
                            'x-queue-type': 'quorum',
                        }),
                    },
                },
            ],
            bindList: [
                {
                    type: 'qte',
                    fromSourceName: (0, config_js_1.getTokenQueueName)(this.token),
                    targetSourceName: config_js_1.ClientExchangeName,
                    key: this.token,
                },
            ],
        });
    }
}
exports.MqManager = MqManager;
//# sourceMappingURL=mq-manager.js.map