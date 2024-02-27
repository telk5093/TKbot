/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs');
const chzzk = require('chzzk');
const { ChzzkClient } = chzzk;
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');
// const lib = require(__dirname + '/../../scripts/lib.js');
// const bot = require(__dirname + '/../../scripts/bot.js');

var io = module.parent.exports.io;
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;

exports.init = async () => {
    let channels = JSON.parse(fs.readFileSync(__dirname + '/../../config/channels.json'));
    
    const client = new ChzzkClient({
        nidAuth: auth.bot.chzzk.nidAuth,
        nidSession: auth.bot.chzzk.nidSession,
    });

    for (let i in channels.chzzk) {
        let _channelId = channels.chzzk[i];

        // Generate chatting instance
        let chzzkChat = client.chat({
            channelId: _channelId,
            // chatChannelId 의 변경을 감지하기 위한 polling 요청의 주기 (선택사항, ms 단위)
            // channelId를 지정할 경우 자동으로 30초로 설정됨, 0초로 설정 시 polling 요청을 하지 않음
            pollInterval: 30 * 1000,
        });

        chzzkChat.on('connect', async () => {
            console.log('[chzzk.js] Connected to chat %s', _channelId);
    
            // 최근 50개의 채팅을 요청 (선택사항, 이 요청으로 불러와진 채팅 및 도네이션은 isRecent 값이 true)
            // chzzkChat.requestRecentChat(50)
    
            // // 채팅 전송 (로그인 시에만 가능)
            // chzzkChat.sendChat('test');
        });
        
        // Reconnect
        chzzkChat.on('reconnect', chatChannelId => {
            console.log('Reconnected to ' + chatChannelId);
        });

        // Blind
        chzzkChat.on('blind', blind => {
            /*
            {
                messageTime: 1708847757069,
                blindType: 'CBOTBLIND',
                blindUserId: null,
                serviceId: 'game',
                message: null,
                userId: 'c6f75be90a32cac61524e91db7648f98',
                channelId: 'N14we7'
            }
            */
            // Blind certain message
            modules['chat'].blind({
                'to': _channelId,
                'userid': blind.userId,
                'time': blind.messageTime,
            });
        })
    
        // General chat
        chzzkChat.on('chat', async (chat) => {
            /*
            chat = {
                profile: {
                    userIdHash: 'c6f75be90a32cac61524e91db7648f98',
                    nickname: 'TELK',
                    profileImageUrl: '',
                    userRoleCode: 'streamer',
                    badge: {
                    imageUrl: 'https://ssl.pstatic.net/static/nng/glive/icon/streamer.png'
                    },
                    title: { name: '스트리머', color: '#D9B04F' },
                    verifiedMark: false,
                    activityBadges: [],
                    streamingProperty: {}
                },
                extras: {
                    chatType: 'STREAMING',
                    osType: 'PC',
                    extraToken: 'YP7A394Rkw3wJKH2hFL0gkisfmwYfIYs/hzZG4u8wL+vG8CwNTOFUB6l0mFHFwi0ZZDdBa+F/2yYCYopEjrXAA==',
                    streamingChannelId: 'c6f75be90a32cac61524e91db7648f98',
                    emojis: ''
                },
                hidden: false,
                message: 'asdf',
                time: 1708847810608,
                isRecent: false,
                memberCount: 2
            }
            */

            // Blinded
            if (chat.hidden) {
                return;
            }

            let username = chat.profile.nickname;
            let message = chat.message
            
            console.log('[CHZZK] ' + _channelId + ' > ' + username + ' >>> ' + message);

            // Add user
            if (!(chat.profile.userIdHash in userList)) {
                let profile = await client.chat.profileCard(chzzkChat.chatChannelId, chat.profile.userIdHash);
                let following = profile.streamingProperty.following;
                userList[chat.profile.userIdHash] = {
                    'username': username,
                    'followed': (following ? following.followDate : null),
                    'lastchat': new Date(),
                    'isMod': chzzk.isModerator(chat.profile),
                    'isStreamer': chzzk.isStreamer(chat.profile),
                };
            }

            // Send a chat message
            modules['core/chat'].send({
                'to': _channelId,
                'username': username,
                'userid': chat.profile.userIdHash,
                'message': message,
                'platform': 'chzzk',
                'isMod': (chat.profile.userRoleCode === 'common_user' ? false : true),
                'time': chat.time,
                'platform': 'chzzk',
                'callback': chzzkChat,
                'method': 'sendChat',
            }, chzzkChat, 'sendChat');
        });

        // Connect
        await chzzkChat.connect();
    }
};

// Join
exports.join = (id) => {
    let channels = JSON.parse(fs.readFileSync(__dirname + '/../../config/channels.json'));
    if (channels.chzzk.indexOf(id) < 0) {
        channels.chzzk.push(id);
        fs.writeFileSync(__dirname + '/../../config/channels.json', JSON.stringify(channels, null, 4));
    }
};
