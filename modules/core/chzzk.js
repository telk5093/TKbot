/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs');
const { ChzzkClient } = require('chzzk');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');
// const lib = require(__dirname + '/../../scripts/lib.js');
// const bot = require(__dirname + '/../../scripts/bot.js');

var io = module.parent.exports.io;
var modules = module.parent.exports.modules;

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

        chzzkChat.on('connect', () => {
            console.log('[chzzk.js] Connected to chat %s', _channelId);
    
            // 최근 50개의 채팅을 요청 (선택사항, 이 요청으로 불러와진 채팅 및 도네이션은 isRecent 값이 true)
            // chzzkChat.requestRecentChat(50)
    
            // // 채팅 전송 (로그인 시에만 가능)
            // chzzkChat.sendChat('test');
        });
        
        // 재연결 (방송 시작 시)
        chzzkChat.on('reconnect', chatChannelId => {
            console.log('Reconnected to ' + chatChannelId);
        });
    
        // General chat
        chzzkChat.on('chat', chat => {
            console.log(chat);

            /*
            chat = profile: {
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
            */

            // Blinded
            if (chat.hidden) {
                return;
            }

            let username = chat.profile.nickname;
            let message = chat.message
            
            console.log('[CHZZK] ' + _channelId + ' > ' + username + ' >>> ' + message);

            // Send a chat message
            modules['chat'].send({
                'to': _channelId,
                'username': username,
                'message': message,
                'platform': 'chzzk',
                'isMod': (chat.profile.userRoleCode === 'common_user' ? false : true),
            });
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

/*
// deperecated
exports.init2 = async () => {
    var chzzkChat = module.parent.exports.chzzkChat;
    const client = new ChzzkClient(auth.options.chzzkAuthInfo);
    
    // // 채널 검색
    // const result = await client.search.channels("TELK")
    // const channel = result.channels[0]

    // 채팅 인스턴스 생성
    chzzkChat = module.parent.exports.chzzkChat = client.chat({
        channelId: auth.options.chzzkChannelId,
        // chatChannelId 의 변경을 감지하기 위한 polling 요청의 주기 (선택사항, ms 단위)
        // channelId를 지정할 경우 자동으로 30초로 설정됨, 0초로 설정 시 polling 요청을 하지 않음
        pollInterval: 30 * 1000,
    });

    chzzkChat.on('connect', chatChannelId => {
        console.log('[chzzk.js] Connected to chat %s', chatChannelId);

        // 최근 50개의 채팅을 요청 (선택사항, 이 요청으로 불러와진 채팅 및 도네이션은 isRecent 값이 true)
        // chzzkChat.requestRecentChat(50)

        // // 채팅 전송 (로그인 시에만 가능)
        // bot.sayToChzzk('test');
    });
    
    // 재연결 (방송 시작 시)
    chzzkChat.on('reconnect', chatChannelId => {
        console.log('Reconnected to ' + chatChannelId);
    });

    // 일반 채팅
    chzzkChat.on('chat', chat => {
        // 블라인드 처리됨
        if (chat.hidden) {
            return;
        }

        let username = chat.profile.nickname;
        let message = chat.message
        
        console.log('[CHZZK] ' + username + ' >>> ' + message);

        module.parent.exports.modules['tts.js'].sendTTS({
            'display-name': username,
            'username': username,
            'message': message,
            'emotes': [],
            'tts_type': 'default',
        });

        io.to('chat').emit('chat', {
            'nick': username,
            'username': username,
            'message': message,
            // 'detail': user,
        });

        module.parent.exports.modules['response.js'].init({
            'msg': message,
            'is_mod': (username === 'TELK'),
        }, 'chzzk');
    });

    // 채팅 연결
    await chzzkChat.connect();
};
*/
