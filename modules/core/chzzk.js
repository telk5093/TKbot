/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs');
const chzzk = require('chzzk');
const { ChzzkClient } = chzzk;
const lib = require(__dirname + '/../../lib/lib.js');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');

var io = module.parent.exports.io;
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;
var channelsConfig = module.parent.exports.channelsConfig;
var chzzkClients = [];

/**
 * Init
 */
var init = exports.init = async () => {
    for (let _channelUid in channelsConfig) {
        let _channelId = channelsConfig[_channelUid].channels.chzzk;
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
    if (channelId === 'null') {
        channelId = null;
    }
    let channelConfig = lib.loadChannelConfig(channelUid);
    channelConfig.channels.chzzk = channelId;
    lib.saveChannelConfig(channelUid, channelConfig);
    connect(channelUid, channelId);
};

/**
 * Quit
 */
var quit = exports.quit = (channelUid) => {
    let channelConfig = lib.loadChannelConfig(channelUid);
    channelConfig.channels.chzzk = null;
    lib.saveChannelConfig(channelUid, channelConfig);

    if (chzzkClients[channelUid] && (typeof chzzkClients[channelUid].disconnect === 'function')) {
        console.log('[chzzk.js] Disconnectd from @%s', channelUid);
        chzzkClients[channelUid].disconnect();
        delete chzzkClients[channelUid];
    }
};

/**
 * Connect
 */
var connect = exports.connect = async (channelUid, channelId) => {
    if (chzzkClients[channelUid] && (typeof chzzkClients[channelUid].connect === 'function')) {
        // console.log('[chzzk.js] Already connected to @%s', channelUid);
        return;
    }

    const client = new ChzzkClient({
        nidAuth: auth.bot.chzzk.nidAuth,
        nidSession: auth.bot.chzzk.nidSession,
    });

    // Generate chatting instance
    let chzzkChat = client.chat({
        channelId: channelId,
        // chatChannelId 의 변경을 감지하기 위한 polling 요청의 주기 (선택사항, ms 단위)
        // channelId를 지정할 경우 자동으로 30초로 설정됨, 0초로 설정 시 polling 요청을 하지 않음
        pollInterval: 30 * 1000,
    });

    chzzkChat.on('connect', async () => {
        console.log('[chzzk.js] Connected to @%s', channelUid);

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
        modules['core/chat'].blind({
            'to': channelId,
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
        let userid = chat.profile.userIdHash;
        let message = chat.message;
        let isMod = (chat.profile.userRoleCode === 'common_user' ? false : true);

        console.log('[CHZZK] @' + channelUid + ' <' + username + '> ' + message);

        // Add user
        if (!(userid in userList)) {
            let following = null;
            if (!chzzk.isStreamer(chat.profile)) {
                let profile = await client.chat.profileCard(chzzkChat.chatChannelId, userid);
                following = profile.streamingProperty.following;
            }
            userList[userid] = {
                'username': username,
                'followed': (following ? following.followDate : null),
                'lastchat': new Date(),
                'isMod': chzzk.isModerator(chat.profile),
                'isStreamer': chzzk.isStreamer(chat.profile),
            };
        }

        // emoji 파싱
        let emotes = {};
        if (chat.extras.emojis && Object.keys(chat.extras.emojis).length > 0) {
            emotes = chat.extras.emojis;
        }

        // Send a chat message
        modules['core/chat'].send({
            'platform': 'chzzk',
            'uid': channelUid,
            'to': channelId,
            'username': username,
            'userid': userid,
            'message': message,
            'emotes': emotes,
            'isMod': isMod,
            'time': chat.time,
            'callback': chzzkChat,
            'method': 'sendChat',
            'client': client,
        });
    });

    // Connect
    try {
        await chzzkChat.connect();
    } catch (e) {
        console.log('[chzzk.js] Fail to connect to @%s', channelId);
    }

    chzzkClients[channelUid] = chzzkChat;
};
