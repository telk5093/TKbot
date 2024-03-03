var exports = module.exports = {
    // DEBUG
    debug: false,

    // Host IP or domain name
	hostName: 'bot.telk.kr',

	// Port for static file services
	staticPortHTTP: 27510,
	staticPortHTTPS: 27511,

    // Use https
    useHTTPS: false,
    httpsCredentials: {
        key: '/key/privkey.pem',
        cert: '/key/fullchain.pem',
    },
};
