var exports = module.exports = {
    // DEBUG
    debug: false,

    // Host IP or domain name
    hostName: 'bot.telk.kr',

    // Port for static file services
    staticPortHTTP: 27510,
    staticPortHTTPS: 27511,

    // Use https
    useHTTPS: true,
    httpsCredentials: {
        key: '/etc/letsencrypt/live/bot.telk.kr/privkey.pem',
        cert: '/etc/letsencrypt/live/bot.telk.kr/fullchain.pem',
    },
};
