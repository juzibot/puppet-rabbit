import { MqSendMessage } from '../model/mq.js';
import EventEmitter from 'events';
export declare class MqManager extends EventEmitter {
    private static _instance;
    static get Instance(): MqManager;
    private puppetConnection;
    private puppetChannel;
    private connected;
    private restartingConnection;
    private restartingChannel;
    private token;
    private static MqCommandResponsePool;
    private static consumption;
    init(token?: string, mqUri?: string): Promise<void>;
    private initConnect;
    private initChannel;
    private prepareConnectListener;
    private createChannelService;
    private prepareChannelListener;
    private reconnectMainConnect;
    reconnectChannel(): Promise<void>;
    startConsume(): Promise<void>;
    stopConsume(): Promise<void>;
    private startConsumer;
    sendToServer(message: MqSendMessage): Promise<any>;
    private handleEvent;
    private prepareQueue;
}
//# sourceMappingURL=mq-manager.d.ts.map