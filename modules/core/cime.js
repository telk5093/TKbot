/**
 * requires
 */
var exports = module.exports = {};
const fs = require('fs').promises;
const path = require('path');
const { CimeClient } = require('cime-sdk');
const lib = require(__dirname + '/../../lib/lib.js');
const auth = require(__dirname + '/../../config/auth.js');
const config = require(__dirname + '/../../config/config.js');
const app = require(__dirname + '/../app.js');

var modules = module.parent.exports.modules;
var userList = exports.userList = module.parent.exports.userList;
var channelsConfig = module.parent.exports.channelsConfig;
var io, chatio;
var modulesIncluded = {};
var cimeClients = [];

// db.json 파일 경로
// const DB_FILE_PATH = path.join(process.cwd(), 'db.json');
let cimeConfigData = exports.cimeConfigData = {
    channelUid: null,
};


// // DB 데이터를 읽어오는 헬퍼 함수
// async function getDbData() {
//     try {
//         const fileContent = await fs.readFile(DB_FILE_PATH, 'utf-8');
//         return JSON.parse(fileContent);
//     } catch (error) {
//         if (error.code !== 'ENOENT') throw error;
//         return {}; // 파일이 없으면 빈 객체 반환
//     }
// }

/**
 * Init
 */
var init = exports.init = async () => {
    for (let _channelUid in channelsConfig) {
        let _channelData = channelsConfig[_channelUid].channels?.cime;
        if (!_channelData) {
            continue;
        }

        connect(_channelUid, _channelData);
    }
};

/**
 * Connect
 */
var connect = exports.connect = async (channelUid, channelData) => {
    if (cimeClients[channelUid] && (typeof cimeClients[channelUid].connect === 'function')) {
        // console.log('[cime.js] Already connected to @%s', channelUid);
        return;
    }

    let options = {};
    if (channelData && channelData.botToken) {
        options = {
            clientId: auth.bot.cime.clientId,
            clientSecret: auth.bot.cime.clientSecret,
            accessToken: channelData.botToken.accessToken,
            scopes: channelData.botToken.scope.split(' '),
        };
    } else {
        options = {
            clientId: auth.bot.cime.clientId,
            clientSecret: auth.bot.cime.clientSecret,
        };
    }
    const client = new CimeClient(options);

    try {
        const me = await client.users.get();
        cimeConfigData.channelUid = me.channelName;
        cimeConfigData.channelId = me.channelId;

        const liveStatus = await client.live.getLiveStatus(me.channelId);
        // console.log(`📺 현재 라이브 상태: ${liveStatus.isLive ? '방송 중 🟢' : '오프라인 🔴'}`);

        // db에서 불러온 refreshToken을 연결해 소켓 갱신 기능을 활성화합니다.
        const cimeChat = client.createEventClient({
            type: 'USER',
            // refreshToken: tokenData.refreshToken,
        });

        // 라이프사이클 이벤트 리스너 등록
        try {
            cimeChat.on('connected', () => {
                console.log('[cime.js] Connected to @%s (#%s)', me.channelName, me.channelId);
            });
            cimeChat.on('disconnected', () => {
                console.log('[cime.js] Disconnectd from @%s', channelUid);
            });
            cimeChat.on('error', (err) => {
                console.error('[cime.js] Websocket error:', err);
            });

            // [실시간 채팅 수신]
            cimeChat.on('CHAT', async (data) => {
                // // Blinded
                // if (chat.hidden) {
                //     return;
                // }
        
                let username = data.profile.nickname;
                let userid = username;  //chat.profile.userIdHash;
                let message = data.content;
                let isMod = (data.profile.badges.id === 'MANAGER' ? true : false);   // Not sure
                let isStreamer = (data.profile.badges.id === 'STREAMER' ? true : false);
        
                console.log('[ci.me] @' + cimeConfigData.channelUid + ' <' + username + '> ' + message);
        
                // Add user
                if (!(userid in userList)) {
                    // let following = null;
                    // if (!chzzk.isStreamer(chat.profile)) {
                    //     let profile = await client.chat.profileCard(chzzkChat.chatChannelId, userid);
                    //     following = profile.streamingProperty.following;
                    // }
                    userList[userid] = {
                        'username': username,
                        // 'followed': (following ? following.followDate : null),
                        'lastchat': new Date(),
                        'isMod': isMod,
                        'isStreamer': isStreamer,
                    };
                }
        
                // emoji 파싱
                let emotes = {};
                if (data.emojis && Object.keys(data.emojis).length > 0) {
                    emotes = data.emojis;
                }
        
                // Send a chat message
                modules['core/chat'].send({
                    'platform': 'cime',
                    'uid': channelUid,
                    // 'to': channelUid,
                    'username': username,
                    'userid': username,   // userid,
                    'message': message,
                    'emotes': emotes,
                    'isMod': isMod,
                    'time': (data.messageTime ? new Date(data.messageTime).getTime() : Date.now()),
                    'callback': client?.chat,
                    'method': 'sendMessage',
                    'client': client,
                });


                // console.log(`💬 [채팅] ${data.profile.nickname}: ${data.content}`);
            });

            // [실시간 후원 수신]
            cimeChat.on('DONATION', (data) => {
                const donator = data.donatorNickname || '익명의 천사';
                console.log(`[cime.js] 🎉 [후원] ${donator}님이 ${data.payAmount}빔을 후원하셨습니다!`);
                console.log(`[cime.js]    📝 메시지: ${data.donationText}\n`);
            });

            // 연결 및 이벤트 구독 시작
            await cimeChat.connect();
            await cimeChat.subscribe('CHAT');
            await cimeChat.subscribe('DONATION');

            
            cimeClients[channelUid] = cimeChat;

        } catch (error) {
            console.error('[cime.js] 봇 실행 중 오류 발생 (토큰이 만료되었을 수 있습니다):', error);
        }
    } catch (e) {
        console.error('[cime.js] 인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.', e);
        quit(channelUid);
        return;
    }
};

/**
 * Join
 */
var join = exports.join = (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
    res.end(JSON.stringify({
        'state': 'success',
        'moveTo': `https://ci.me/auth/openapi/account-interlock?clientId=${auth.bot.cime.clientId}&redirectUri=https://${config.hostName}/cime/oauth/callback&state=${lib.random()}`
    }));
};

/**
 * Quit
 */
var quit = exports.quit = (channelUid) => {
    let channelConfig = lib.loadChannelConfig(channelUid);
    channelConfig.channels.cime = null;
    lib.saveChannelConfig(channelUid, channelConfig);

    if (cimeClients[channelUid] && (typeof cimeClients[channelUid].disconnect === 'function')) {
        console.log('[cime.js] Disconnectd from @%s', channelUid);
        cimeClients[channelUid].disconnect();
        delete cimeClients[channelUid];
    }
    return;
};

// ====================================================================
// 🌐 Express 라우터 및 서버 설정
// ====================================================================

// OAuth 콜백 라우트
app.get('/cime/oauth/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('인증 코드가 없습니다.');
    }

    try {
        const channelUid = req.session.channelUid;

        // 초기 인스턴스 생성
        const client = new CimeClient({
            clientId: auth.bot.cime.clientId,
            clientSecret: auth.bot.cime.clientSecret,
        });

        // SDK를 사용해 code로 토큰 정보 발급받기
        const tokenResponse = await client.authorize(code);

        // db.json 읽고 쓰기
        let cimeDbData = {
            channelUid: channelUid,
            botToken: tokenResponse,
            updatedAt: new Date().toISOString()
        };

        // await fs.writeFile(DB_FILE_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
        // console.log('💾 새로운 인증 토큰이 db.json에 저장되었습니다.');
        let channelConfig = lib.loadChannelConfig(channelUid);
        channelConfig.channels.cime = cimeDbData;
        lib.saveChannelConfig(channelUid, channelConfig);
        cimeConfigData = cimeDbData;

        // 인증 성공 후 즉시 봇 실행
        connect(channelUid, cimeDbData);

        // 인증 성공 후 /settings로 리다이렉트
        res.redirect('https://bot.telk.kr/settings');
    } catch (error) {
        console.error('❌ OAuth 인증 또는 DB 저장 중 오류 발생:', error);
        res.status(500).send('인증 실패');
    }
});

// // 서버 시작
// app.listen(443, async () => {
//     console.log(`🚀 Server is running on http://${config.hostName}`);
//     console.log(`🔑 OAuth 인증을 위해 브라우저에서 다음 URL로 이동하세요:`);
//     console.log(`👉 https://ci.me/auth/openapi/account-interlock?clientId=${auth.bot.cime.clientId}&redirectUri=http://${config.hostName}/oauth/callback&state=${rand(100000, 999999)}`)

//     // 서버가 켜질 때 db.json에 기존 토큰이 있는지 확인
//     /*const dbData = await getDbData();

//     if (dbData && dbData.botToken) {
//         console.log('📂 db.json에서 기존 토큰을 발견했습니다. 봇을 자동으로 시작합니다...');
//         runBot(dbData.botToken);
//     } else {
//         console.log(`⚠️ 저장된 봇 토큰이 없습니다. 브라우저에서 인증을 진행해주세요.`);
//         console.log(`👉 https://ci.me/auth/openapi/account-interlock?clientId=${auth.bot.cime.clientId}&redirectUri=http://${config.hostName}/oauth/callback&state=${rand(100000, 999999)}`);
//     }*/
// });

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}