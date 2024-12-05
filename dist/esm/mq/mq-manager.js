import { log } from '@juzi/wechaty-puppet';
import Onirii from 'onirii';
import { sleep, SECOND, MINUTE } from '../util/time.js';
import { MqEventType, MqMessageType, } from '../model/mq.js';
import EventEmitter from 'events';
import { ClientExchangeName, getTokenQueueName, ServerExchangeName, } from './config.js';
import { v4 } from 'uuid';
const PRE = 'MqManager';
var LISTENER_TYPE;
(function (LISTENER_TYPE) {
    LISTENER_TYPE[LISTENER_TYPE["ERROR"] = 0] = "ERROR";
    LISTENER_TYPE[LISTENER_TYPE["CLOSE"] = 1] = "CLOSE";
})(LISTENER_TYPE || (LISTENER_TYPE = {}));
export class MqManager extends EventEmitter {
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
        log.info(PRE, `consuming content: ${msg?.content.toString()}`);
        const messageString = msg?.content.toString();
        if (!messageString) {
            await channel?.ackMessage(msg);
            return;
        }
        try {
            const message = JSON.parse(messageString);
            if (message.type === MqMessageType.command) {
                const waiter = this.MqCommandResponsePool.get(message.traceId);
                if (!waiter) {
                    log.warn(PRE, `MqCommandResponsePool Not Found ${message.traceId}`);
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
            log.error(PRE, `consumption() error: ${e.stack}`);
        }
        await channel?.ackMessage(msg);
    }
    async init(token, mqUri) {
        log.info(PRE, `init(${token})`);
        if (!this.puppetConnection) {
            if (!(token && mqUri)) {
                throw new Error(`init() need token and mqUri`);
            }
            // no idea why have to add default
            this.puppetConnection = Onirii.default.createAmqpConnect(`puppet-${token}-${Date.now()}`, mqUri);
            this.token = token;
        }
        await this.initConnect();
        this.connected = true;
        await this.initChannel();
        await this.startConsumer();
    }
    async initConnect() {
        log.info(PRE, 'initConnect()');
        await this.puppetConnection.ready();
        await this.prepareConnectListener();
        log.info(PRE, 'initConnect() connected mq service...');
    }
    async initChannel() {
        log.info(PRE, 'initChannel()');
        this.puppetChannel = await this.createChannelService(10);
        await this.prepareChannelListener();
        await this.prepareQueue(this.puppetChannel);
    }
    async prepareConnectListener() {
        this.puppetConnection?.addCloseListener((err) => void this.reconnectMainConnect(err, LISTENER_TYPE.CLOSE));
        this.puppetConnection?.addErrorListener((err) => void this.reconnectMainConnect(err, LISTENER_TYPE.ERROR));
    }
    async createChannelService(prefetch) {
        log.info(PRE, 'Creating Channel ...');
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
            log.info(`puppetChannel on close listener`);
            void this.reconnectChannel();
        });
    }
    async reconnectMainConnect(err, type) {
        log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]})`);
        this.connected = false;
        if (this.restartingConnection) {
            log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) under processing...`);
            return;
        }
        this.restartingConnection = true;
        log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) MQ Service Connect Receive ${LISTENER_TYPE[type]} event: ${err}`);
        try {
            await this.init();
            await this.startConsume();
        }
        catch (e) {
            log.error(PRE, `reconnectMainConnect(${LISTENER_TYPE[type] || type}) Reconnect MQ Service Failed: ${e}`);
            void this.reconnectMainConnect(e, type);
        }
        finally {
            this.restartingConnection = false;
        }
        log.info(PRE, `reconnectMainConnect(${LISTENER_TYPE[type]}) Reconnected MQ Service Done.`);
    }
    async reconnectChannel() {
        log.info(PRE, `reconnectChannel()`);
        if (this.restartingConnection) {
            log.error(PRE, `reconnectChannel() restart connect under processing...`);
            return;
        }
        if (this.restartingChannel) {
            log.error(PRE, `reconnectChannel(}) restart channel under processing...`);
            return;
        }
        this.restartingChannel = true;
        log.error(PRE, `reconnectChannel(}) MQ Service Channel Connect Receive Close event.`);
        try {
            await sleep(MINUTE);
            this.puppetChannel = await this.createChannelService(10);
            await this.startConsumer();
        }
        catch (e) {
            log.error(PRE, `reconnectChannel(}) Reconnect MQ Service Failed: ${e}`);
            return this.reconnectChannel();
        }
        finally {
            this.restartingChannel = false;
        }
        log.info(PRE, `reconnectChannel(}) Reconnected MQ Service Done.`);
    }
    async startConsume() {
        while (true) {
            if (this.connected) {
                break;
            }
            log.warn(PRE, 'startConsume() MQ Server Connect Not Ready Yet');
            await sleep(5 * SECOND);
        }
        await this.stopConsume();
        log.info(PRE, 'startConsume() Creating Consumer ...');
        await this.startConsumer();
    }
    async stopConsume() {
        log.info(PRE, 'stopConsume() Stopping Consumer ...');
        this.puppetChannel?.killConsume('puppetConsumer');
    }
    async startConsumer() {
        log.info(PRE, 'startConsumer()');
        this.puppetChannel?.consume(getTokenQueueName(this.token), (msg) => void MqManager.consumption(msg, this.puppetChannel), {
            consumerTag: 'puppetConsumer',
        });
    }
    async sendToServer(message) {
        if (!message.traceId) {
            message.traceId = v4();
        }
        log.info(PRE, `sendToServer(${JSON.stringify(message)})`);
        this.puppetChannel?.sendMessageToExchange('tiktok.message.to.server', 'command', Buffer.from(JSON.stringify(message)), {
            timestamp: Date.now(),
            appId: this.token,
            expiration: 10 * MINUTE,
        });
        return new Promise((resolve, reject) => {
            const waiter = {
                resolver: resolve,
                rejector: reject,
                traceId: message.traceId,
                timer: setTimeout(() => {
                    reject(new Error(`async request timeout, traceId: ${message.traceId}`));
                }, 1 * MINUTE),
            };
            MqManager.MqCommandResponsePool.set(message.traceId, waiter);
        })
            .then((data) => {
            log.info(PRE, `handleResponse(${JSON.stringify(data)})`);
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
        log.info(PRE, `handleEvent(${eventType}, ${data})`);
        switch (eventType) {
            case MqEventType.dong:
                this.emit('dong', JSON.parse(data));
                break;
            case MqEventType.login:
                this.emit('login', JSON.parse(data));
                break;
            case MqEventType.postComment:
                this.emit('postComment', JSON.parse(data));
                break;
            case MqEventType.loginUrl:
                this.emit('loginUrl', JSON.parse(data));
                break;
            case MqEventType.dirty:
                this.emit('dirty', JSON.parse(data));
                break;
            case MqEventType.logout:
                this.emit('logout', JSON.parse(data));
                break;
            default:
                log.warn(PRE, `handleEvent(${eventType}, ${data}) Not Support`);
        }
    }
    async prepareQueue(channel) {
        if (!channel) {
            log.warn(PRE, `prepare() need channel`);
            return;
        }
        await channel.initMetaConfigure({
            queueList: [
                {
                    name: getTokenQueueName(this.token),
                    options: {
                        arguments: Object({
                            'x-queue-type': 'quorum',
                        }),
                    },
                },
            ],
            exchangeList: [
                {
                    name: ServerExchangeName,
                    type: 'direct',
                    options: {
                        arguments: Object({
                            'x-queue-type': 'quorum',
                        }),
                    },
                },
                {
                    name: ClientExchangeName,
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
                    fromSourceName: getTokenQueueName(this.token),
                    targetSourceName: ClientExchangeName,
                    key: this.token,
                },
            ],
        });
    }
}
//# sourceMappingURL=mq-manager.js.map