var exports = module.exports = {};

/**
 * requires
 */
const fs = require('fs');
const ottd = require('node-openttd-admin-class');
const lib = require(__dirname + '/../lib/lib.js');

// const auth = require('../config/auth.js');
// const config = require('../config/config.js');
// const lib = require('../scripts/lib.js');
// const bot = require('../scripts/bot.js');

var oc = null;
var TKbotInfo = {
    'name': 'TKbot',
    'version': '1.0',
};
const CompanyRemoveReasonsInString = ['수동', '자동 삭제', '파산'];
var clientInfo = [];


// Initialize
exports.init = (data) => {
    let message = data.message;
    let channel = data.to;
    let isMod = data.isMod;
    
    // Connect to OpenTTD server
    if (isMod && lib.isMatch(message, ['!ottd connect', '!ottd start'])) {
        let _channelConfig = lib.loadChannelsConfig(data.uid);
        if (!_channelConfig.openttd || !_channelConfig.openttd.host || !_channelConfig.openttd.port) {
            return;
        }

        // Connection host/port
        let openttdHost = _channelConfig.openttd.host;
        let openttdPort = _channelConfig.openttd.port;
        let openttdPassword = _channelConfig.openttd.password;


        console.log('[ottdchat] Try to connect %s:%d', String(openttdHost), Number(openttdPort));
        try {
            oc = new ottd.connection();
            oc.connect(String(openttdHost), Number(openttdPort));

            oc.on('connect', () => {
                oc.authenticate(String(TKbotInfo.name), String(openttdPassword), String(TKbotInfo.version));
            });
            oc.on('authenticate', ocdata => {
                oc.send_update_frequency(ottd.enums.UpdateTypes.CHAT, ottd.enums.UpdateFrequencies.AUTOMATIC);
                oc.send_update_frequency(ottd.enums.UpdateTypes.CLIENT_INFO, ottd.enums.UpdateFrequencies.AUTOMATIC);
                data.callback[data.method]('[OpenTTD] 채팅 연동을 시작합니다.');
            });
            oc.on('welcome', ocdata => {
                console.log(' - Welcome to %s(%s) %sserver', ocdata.name, ocdata.version, ocdata.s_dedicated ? 'dedicated ' : '');
                console.log(' - Map name: %s (with seed %d), landscape is %s and started since %d ago', ocdata.map.name, ocdata.map.seed, ['temperate', 'subarctic', 'tropical', 'toyland'][ocdata.map.landscape], ocdata.map.startdate);
                console.log(' - Map size is %dx%d', ocdata.map.mapwidth, ocdata.map.mapheight);
            });
            oc.on('clientjoin', id => {
                data.callback[data.method]('[OpenTTD] ' + getNick(id) + ' 님이 입장하셨습니다.');
            });
            oc.on('clientinfo', client => {
                clientInfo[client.id] = {
                    'name': client.name,
                    'ip': client.ip,
                    'id': client.id,
                };
            });
            oc.on('clientupdate', client => {
                clientInfo[client.id] = {
                    'name': client.name,
                    'ip': client.ip,
                    'id': client.id,
                };
            });
            oc.on('clientquit', quit_client => {
                if (!clientInfo) {
                    clientInfo = {};
                }

                data.callback[data.method]('[OpenTTD] ' + getNick(quit_client.id) + ' 님이 퇴장하셨습니다.');
                delete clientInfo[quit_client.id];
            });
            oc.on('companyremove', ocdata => {
                let company_no = ocdata.id * 1 + 1;
                data.callback[data.method]('[OpenTTD] #' + company_no + '번 회사가 삭제되었습니다 (사유: ' + CompanyRemoveReasonsInString[ocdata.reason] + ')');
            });
            oc.on('chat', ocdata => {
                if (ocdata.id === 1) {
                    return;
                }

                switch (ocdata.action) {
                    case ottd.enums.Actions.JOIN:
                        data.callback[data.method]('[OpenTTD] ' + getNick(ocdata.id) + ' 님이 입장하셨습니다.');
                        break;
                    case ottd.enums.Actions.LEAVE:
                        data.callback[data.method]('[OpenTTD] ' + getNick(ocdata.id) + ' 님이 퇴장하셨습니다.');
                        break;
                    case ottd.enums.Actions.SERVER_MESSAGE:
                        data.callback[data.method]('[OpenTTD] <서버> ' + ocdata.message + '');
                        break;
                    case ottd.enums.Actions.CHAT:
                        data.callback[data.method]('[OpenTTD] <' + getNick(ocdata.id) + '> ' + ocdata.message + '');
                        // let _tts = module.parent.exports.modules['tts.js'];
                        // _tts.sendTTS({
                        //     'username': getNick(ocdata.id),
                        //     'message' : ocdata.message,
                        // });
                        break;
                    case ottd.enums.Actions.GIVE_MONEY:
                        data.callback[data.method]('[OpenTTD] <' + getNick(ocdata.id) + '> ' + ocdata.message + '에 돈을 보냈습니다 (￡' + ocdata.money + ')');
                        break;
                    case ottd.enums.Actions.COMPANY_SPECTATOR:
                        data.callback[data.method]('[OpenTTD] ' + getNick(ocdata.id) + ' 님이 관전을 시작하셨습니다.');
                        break;
                    case ottd.enums.Actions.COMPANY_JOIN:
                        data.callback[data.method]('[OpenTTD] ' + getNick(ocdata.id) + ' 님이 ' + ocdata.money + '번 회사에 참여하셨습니다.');
                        break;
                    case ottd.enums.Actions.COMPANY_NEW:
                        data.callback[data.method]('[OpenTTD] ' + getNick(ocdata.id) + ' 님이 새로운 회사(' + ocdata.money + '번)를 창설하셨습니다.');
                        break;

                    default:
                        console.log(ocdata);
                }
            });
            oc.on('error', err => {
                switch (err) {
                    case 'connectionerror':
                        console.log('[ottdchat] 봇을 실행하려고 했으나 서버가 오프라인임', err);
                        break;

                    case 'connectionclose':
                        data.callback[data.method]('[OpenTTD] 채팅 연동을 종료합니다.');
                        oc = null;
                        break;
                }
            });
        } catch (e) {
            console.log('[ottdchat] ', e);
        }

    // Disconnect
    } else if (isMod && lib.isMatch(message, ['!ottd disconnect', '!ottd end'])) {
        if (!oc) {
            return;
        }
        oc.close();

    // Send message to ingame
    } else {
        if (!oc) {
            return;
        }
        if (data.username === 'TKbot') {
            return;
        }
        oc.send_rcon('say "<' + data.username + '> ' + message.replace(/"/ig, '\"') + '"');
    }

    return;


}

var getNick = (id) => {
    if (!oc) return;

    if (!clientInfo[id]) {
        oc.send_poll(ottd.enums.UpdateTypes.CLIENT_INFO, id);
        nick = '???';
    } else {
        nick = clientInfo[id].name;
    }
    return nick;
}