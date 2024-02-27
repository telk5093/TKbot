var exports = module.exports = {};

/**
 * requires
 */
const fs = require('fs');

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var userList = exports.userList = module.parent.exports.userList;
var io, chatio;
var modulesIncluded = {};

/**
 * Initialization
 */
var init = exports.init = () => {
    // Load chat message modules
    let _modules = fs.readdirSync(__dirname + '/../');
    for (let i = 0; i < _modules.length; i++) {
        let _moduleName = String(_modules[i]).substring(0, _modules[i].length - 3);
        if (!modulesIncluded[_moduleName] && String(_modules[i]).substring(0, 1) !== '#' && String(_modules[i]).substring(_modules[i].length - 3, _modules[i].length ) === '.js') {
            modules[_moduleName] = require(__dirname + '/../' + _modules[i]);
            if (typeof modules[_moduleName].init === 'function') {
                console.log('[chat module] Successfully loaded: %s', _modules[i]);
                modulesIncluded[_moduleName] = modules[_moduleName];
            }
        }
    }
};

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
 *     callback                         Callback function to send chat message
 *     method                           Callback function's method to send chat message
 * }
 */
var send = exports.send = (data) => {
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

    // Call chat message module
    for (let _moduleName in modulesIncluded) {
        modulesIncluded[_moduleName].init(data);
    }
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
    if (chatio) {
        chatio.to(data.to).emit('blind', {
            'userid': data.userid,
            'time': data.time,
        });
    }
};
