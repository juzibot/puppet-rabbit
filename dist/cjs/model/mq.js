"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqEventType = exports.MqCommandType = exports.MqMessageType = void 0;
var MqMessageType;
(function (MqMessageType) {
    MqMessageType["command"] = "command";
    MqMessageType["event"] = "event";
})(MqMessageType || (exports.MqMessageType = MqMessageType = {}));
var MqCommandType;
(function (MqCommandType) {
    MqCommandType["start"] = "start";
    MqCommandType["ding"] = "ding";
    MqCommandType["contactPayload"] = "contactPayload";
    MqCommandType["postSearch"] = "postSearch";
    MqCommandType["postPayload"] = "postPayload";
    MqCommandType["postPayloadSayable"] = "postPayloadSayable";
    MqCommandType["postPublish"] = "postPublish";
    MqCommandType["dirtyPayload"] = "dirtyPayload";
})(MqCommandType || (exports.MqCommandType = MqCommandType = {}));
var MqEventType;
(function (MqEventType) {
    MqEventType["dong"] = "dong";
    MqEventType["login"] = "login";
    MqEventType["loginUrl"] = "loginUrl";
    MqEventType["postComment"] = "postComment";
    MqEventType["dirty"] = "dirty";
    MqEventType["logout"] = "logout";
})(MqEventType || (exports.MqEventType = MqEventType = {}));
//# sourceMappingURL=mq.js.map