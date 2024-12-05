export var MqMessageType;
(function (MqMessageType) {
    MqMessageType["command"] = "command";
    MqMessageType["event"] = "event";
})(MqMessageType || (MqMessageType = {}));
export var MqCommandType;
(function (MqCommandType) {
    MqCommandType["start"] = "start";
    MqCommandType["ding"] = "ding";
    MqCommandType["contactPayload"] = "contactPayload";
    MqCommandType["postSearch"] = "postSearch";
    MqCommandType["postPayload"] = "postPayload";
    MqCommandType["postPayloadSayable"] = "postPayloadSayable";
    MqCommandType["postPublish"] = "postPublish";
    MqCommandType["dirtyPayload"] = "dirtyPayload";
})(MqCommandType || (MqCommandType = {}));
export var MqEventType;
(function (MqEventType) {
    MqEventType["dong"] = "dong";
    MqEventType["login"] = "login";
    MqEventType["loginUrl"] = "loginUrl";
    MqEventType["postComment"] = "postComment";
    MqEventType["dirty"] = "dirty";
    MqEventType["logout"] = "logout";
})(MqEventType || (MqEventType = {}));
//# sourceMappingURL=mq.js.map