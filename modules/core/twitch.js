/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs');
const tmi = require('tmi.js');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');

var io = module.parent.exports.io;
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;
var channelsConfig = module.parent.exports.channelsConfig;

exports.init = async () => {
    for (let _channelUid in channelsConfig) {
        let _channelId = channelsConfig[_channelUid].channels.twitch;
        if (!_channelId) {
            continue;
        }

        var twitchClient = exports.twitchClient = new tmi.client({
            channels: [
                _channelId,
            ],
            identity: {
                username: auth.bot.twitch.id,
                password: auth.bot.twitch.password,
            },
            options: {
                debug: false,
            }
        });
        twitchClient.connect().then((rst) => {
            console.log('[INFO] 채팅방 접속 완료 (' + rst[0] + ':' + rst[1] + ')');
        });

        // On message
        twitchClient.on('chat', async (channel, user, message, self) => {
            // Ignore self
            if (self) {
                return;
            }

            let _channelId = channel;
            let username = user['display-name'];
            let userid = user['username'];
            let isMod = !(String(user['badges-raw']).indexOf('broadcaster/1') < 0 && String(user['badges-raw']).indexOf('moderator/1') < 0);

            console.log('[Twitch] ' + _channelId + ' > ' + username + ' >>> ' + message);

            // // Add user
            // if (!(chat.profile.userIdHash in userList)) {
            //     let profile = await client.chat.profileCard(chzzkChat.chatChannelId, chat.profile.userIdHash);
            //     let following = profile.streamingProperty.following;
            //     userList[chat.profile.userIdHash] = {
            //         'username': username,
            //         'followed': (following ? following.followDate : null),
            //         'lastchat': new Date(),
            //         'isMod': chzzk.isModerator(chat.profile),
            //         'isStreamer': chzzk.isStreamer(chat.profile),
            //     };
            // }

            // Send a chat message
            modules['core/chat'].send({
                'platform': 'twitch',
                'uid': _channelUid,
                'to': _channelId,
                'username': username,
                'userid': userid,
                'message': message,
                'isMod': isMod,
                'time': (new Date().getTime()),
                'callback': twitchClient,
                'method': 'say',
                // 'client': client,
            });
        });
    }
};
