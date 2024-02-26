/**
 * requires
 */
var exports = module.exports = {};
// const socketio = require('socket.io');

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var io, chatio;

/**
 * socket
 */
var socket = exports.socket = (socket) => {
    io = module.parent.exports.io;
    chatio = module.parent.exports.chatio;

    let ip = socket.handshake.address;
    if (ip.indexOf(':') >= 0 && ip !== '::1') {
        let tmpip = ip.split(':');
        ip = tmpip[tmpip.length - 1];
    }

    socket.on('channelId', channelId => {
        socket.join(channelId);
        console.log('[chatio] %s connected to %s', ip, channelId);
    });

    socket.on('connection', (_socket) => {
        console.log('chat 네임스페이스 접속');
    });
};

/**
 * Send a chat message
 * 
 * @param data = {
 *     to
 *     username
 *     message
 *     platform
 *     isMod
 *     time
 * }
 * @param chzzkChat
 */
var send = exports.send = (data, chzzkChat) => {
    if (!data.to) {
        return;
    }
    if (data.username === 'TKbot') {
        return;
    }
    if (chatio) {
        chatio.to(data.to).emit('data', {
            'userid': data.userid,
            'username': data.username,
            'message': data.message,
            'time': data.time,
        });
    }

    // response
    modules['response'].response(data, chzzkChat, 'sendChat');
};


/**
 * Blind certain message
 * @param data = {
 *     to
 *     userid
 *     time
 * }
 */
var blind = exports.blind = (data) => {
    if (!data.to) {
        return;
    }
    if (data.username === 'TKbot') {
        return;
    }
    chatio.to(data.to).emit('blind', {
        'userid': data.userid,
        'time': data.time,
    });
};
