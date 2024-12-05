"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerExchangeName = exports.ClientExchangeName = exports.getTokenQueueName = void 0;
const getTokenQueueName = (token) => `rabbit_${token}`;
exports.getTokenQueueName = getTokenQueueName;
exports.ClientExchangeName = 'tiktok.message.to.client';
exports.ServerExchangeName = 'tiktok.message.to.server';
//# sourceMappingURL=config.js.map