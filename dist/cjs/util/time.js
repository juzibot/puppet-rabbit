"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.DAY = exports.HOUR = exports.MINUTE = exports.SECOND = void 0;
exports.SECOND = 1000;
exports.MINUTE = 60 * exports.SECOND;
exports.HOUR = 60 * exports.MINUTE;
exports.DAY = 24 * exports.HOUR;
const sleep = async (time) => {
    await new Promise((resolve) => setTimeout(resolve, time));
};
exports.sleep = sleep;
//# sourceMappingURL=time.js.map