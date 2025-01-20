export const getTokenQueueName = (token: string) => `rabbit_${token}`
export const getClientExchangeName = (exchangeBaseName: string) => `${exchangeBaseName}.message.to.client`
export const getServerExchangeName = (exchangeBaseName: string) => `${exchangeBaseName}.message.to.server`
