/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs');
const tmi = require('tmi.js');
const axios = require('axios');
const lib = require(__dirname + '/../../lib/lib.js');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');

var io = module.parent.exports.io;
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;
var channelsConfig = module.parent.exports.channelsConfig;
var twitchClients = [];

/**
 * Init
 */
exports.init = async () => {
    for (let _channelUid in channelsConfig) {
        let _channelId = channelsConfig[_channelUid].channels.twitch;
        if (!_channelId) {
            continue;
        }

        connect(_channelUid, _channelId);
    }
};

/**
 * Join
 */
var join = exports.join = (channelUid, channelId) => {
    let channelConfig = lib.loadChannelConfig(channelUid);
    channelConfig.channels.twitch = channelId;
    lib.saveChannelConfig(channelUid, channelConfig);
    connect(channelUid, channelId);
};

/**
 * Quit
 */
var quit = exports.quit = (channelUid) => {
    let channelConfig = lib.loadChannelConfig(channelUid);
    channelConfig.channels.twitch = null;
    lib.saveChannelConfig(channelUid, channelConfig);

    if (twitchClients[channelUid] && (typeof twitchClients[channelUid].disconnect === 'function')) {
        console.log('[twitch.js] Disconnectd from @%s', channelUid);
        twitchClients[channelUid].disconnect();
        delete twitchClients[channelUid];
    }
};

/**
 * Connect
 */
var connect = exports.connect = async (channelUid, channelId) => {
    if (twitchClients[channelUid] && (typeof twitchClients[channelUid].connect === 'function')) {
        // console.log('[twitch.js] Already connected to @%s', channelUid);
        return;
    }

    let twitchChat = exports.twitchChat = new tmi.client({
        channels: [
            channelId,
        ],
        identity: {
            username: auth.bot.twitch.id,
            password: auth.bot.twitch.password,
        },
        options: {
            debug: false,
        }
    });
    twitchChat.connect().then((rst) => {
        console.log('[twitch.js] Connected to @%s', channelId);
    });

    // On message
    twitchChat.on('chat', async (channel, user, message, self) => {
        // Ignore self
        if (self) {
            return;
        }

        // user.emotes = { '675510': [ '4-14', '16-26' ] },
        // 받은 emotes 데이터를 가공
        var emotes = {};
        for (let _emoteId in user.emotes) {
            user.emotes[_emoteId].forEach(function(_emotePos) {
                let tmp = _emotePos.split(/-/g);
                let from = Number(tmp[0]);
                let to = Number(tmp[1]);
                emotes[message.slice(from, to + 1)] = 'https://static-cdn.jtvnw.net/emoticons/v2/' + _emoteId + '/default/dark/3.0';
            });
        }

        let _channelId = channel.substring(1);
        let username = user['display-name'];
        let userid = user['username'];
        let isMod = !(String(user['badges-raw']).indexOf('broadcaster/1') < 0 && String(user['badges-raw']).indexOf('moderator/1') < 0);
        let isStreamer = !!(String(user['badges-raw']).indexOf('broadcaster/1') > 0);

        console.log('[Twitch] @' + channelUid + ' <' + username + '> ' + message);

        // Add user
        if (!(userid in userList)) {
            let followingDate = null;

            // Get follow information
            if (channelId != userid) {
                followingDate = await axios({
                    url: 'https://commands.garretcharp.com/twitch/followage/' + channelId + '/' + userid,
                    method: 'GET',
                }).then(res => {
                    let response = String(res.data).replace(/\./ig, '');
                    if (response.indexOf('not following') >= 0) {
                        return null;
                    } else {
                        let _y = _m = _d = _h = _i = _s = 0;
                        let _tmp1 = response.split(' for ');
                        let _tmp2 = String(_tmp1[1]).trim().split(',');
                        for (let i in _tmp2) {
                            let _tmp3 = String(_tmp2[i]).trim().split(' ');
                            let _tmp4 = String(_tmp3[1]).trim();
                            switch (_tmp4) {
                                case 'year':
                                case 'years':
                                    _y = Number(_tmp3[0]);
                                    break;
                                case 'month':
                                case 'months':
                                    _m = Number(_tmp3[0]);
                                    break;
                                case 'day':
                                case 'days':
                                    _d = Number(_tmp3[0]);
                                    break;
                                case 'hour':
                                case 'hours':
                                    _h = Number(_tmp3[0]);
                                    break;
                                case 'minute':
                                case 'minutes':
                                    _i = Number(_tmp3[0]);
                                    break;
                                case 'second':
                                case 'seconds':
                                    _s = Number(_tmp3[0]);
                                    break;
                            }
                        }

                        let ns = new Date();
                        ns.setUTCFullYear(ns.getUTCFullYear() % 100 + 2000 - _y, ns.getUTCMonth() - _m, ns.getUTCDate() - _d);
                        ns.setUTCHours(ns.getUTCHours() - _h);
                        ns.setUTCMinutes(ns.getUTCMinutes() - _i);
                        ns.setUTCSeconds(ns.getUTCSeconds() - _s);
                        since = lib.prettyDate(ns).full_str;

                        return since;
                    }
                }).catch(err => {
                    // console.log(err);
                    return null;
                });
            }

            userList[userid] = {
                'username': username,
                'followed': (followingDate ? followingDate : null),
                'lastchat': new Date(),
                'isMod': isMod,
                'isStreamer': isStreamer,
            };
        }

        // Send a chat message
        modules['core/chat'].send({
            'platform': 'twitch',
            'uid': channelUid,
            'to': channelId,
            'username': username,
            'userid': userid,
            'message': message,
            'emotes': emotes,
            'isMod': isMod,
            'time': (new Date().getTime()),
            'callback': twitchChat,
            'method': 'say',
            // 'client': client,
        });
    });
    

    twitchClients[channelUid] = twitchChat;
};
