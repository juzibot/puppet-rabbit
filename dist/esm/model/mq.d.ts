export interface MqSendMessage {
    traceId?: string;
    commandType: MqCommandType;
    data: string;
}
export interface MqReceiveMessage {
    traceId: string;
    type: MqMessageType;
    eventType?: MqEventType;
    data: string;
    code?: number;
    error?: string;
}
export declare enum MqMessageType {
    command = "command",
    event = "event"
}
export declare enum MqCommandType {
    start = "start",
    ding = "ding",
    contactPayload = "contactPayload",
    postSearch = "postSearch",
    postPayload = "postPayload",
    postPayloadSayable = "postPayloadSayable",
    postPublish = "postPublish",
    dirtyPayload = "dirtyPayload"
}
export declare enum MqEventType {
    dong = "dong",
    login = "login",
    loginUrl = "loginUrl",
    postComment = "postComment",
    dirty = "dirty",
    logout = "logout"
}
export interface MqCommandResponseWaiter {
    resolver: (data: any) => void;
    rejector: (e: Error) => void;
    traceId: string;
    timer: NodeJS.Timeout;
}
//# sourceMappingURL=mq.d.ts.map