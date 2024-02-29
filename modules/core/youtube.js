
/**
 * requires
 */
var exports = module.exports = {};
const lib = require(__dirname + '/../../lib/lib.js');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');
const { LiveChat } = require('youtube-chat');


var io = module.parent.exports.io;
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;
var channelsConfig = module.parent.exports.channelsConfig;

var youtubeChatSent = [];
var youtubeLiveId = null;

var init = exports.init = (data) => {
    for (let _channelUid in channelsConfig) {
        let _channelId = channelsConfig[_channelUid].channels.youtube;
        if (!_channelId) {
            continue;
        }

        const youtubeChat = exports.youtubeChat = new LiveChat({
            channelId: _channelId
        });

        var youtubeChat_switch = false;
        youtubeChat.on('start', (liveId) => {
            console.log('[youtube.js] Connected at %s', liveId);
            youtubeLiveId = liveId;
            setTimeout(function() {
                youtubeChat_switch = true;
            }, 3000);
        });
        youtubeChat.on('end', (reason) => {
            console.log('[youtube.js] disconnected');
            youtubeLiveId = null;
        });
        youtubeChat.on('chat', (chatItem) => {
            if (!youtubeChat_switch) {
                return;
            }
            if (youtubeChatSent.indexOf(chatItem.id) >= 0) {
                return;
            }
            youtubeChatSent.push(chatItem.id);
            let username = chatItem.author.name;
            let userid = chatItem.author.channelId;
            let isMod = chatItem.isModerator;
            let isStreamer = chatItem.isOwner;
            let message = '';
            for (let i in chatItem.message) {
                if (chatItem.message[i].text) {
                    message += chatItem.message[i].text;
                }
            }

            console.log('[youtube.js] ' + _channelId + ' > ' + username + ' >>> ' + message);

            // Add user
            if (!(userid in userList)) {
                userList[userid] = {
                    'username': username,
                    // 'followed': (followingDate ? followingDate : null),
                    'lastchat': new Date(),
                    'isMod': isMod,
                    'isStreamer': isStreamer,
                };
            }

            // Send a chat message
            modules['core/chat'].send({
                'platform': 'youtube',
                'uid': _channelUid,
                'to': _channelId,
                'username': username,
                'userid': userid,
                'message': message,
                'isMod': isMod,
                'time': (new Date(chatItem.timestamp)).getTime(),
                'callback': youtubeChat,
                'method': '',
                // 'client': client,
            });
        });
        youtubeChat.on('error', (err) => {});

        startYouTubeChat(youtubeChat);
        setInterval(function() {
            startYouTubeChat(youtubeChat);
        }, 10 * 1000);
    }
}

var startYouTubeChat = (youtubeChat) => {
    if (youtubeLiveId) {
        return;
    }
    // console.log('[youtube.js] try to connect');
    const ok = youtubeChat.start();
    if (!ok) {
        console.log('[youtube.js] Failed to start, check emitted error');
    }
};
