var exports = module.exports = {};

/**
 * requires
 */
const fs = require('fs');
const ottd = require('node-openttd-admin-class');
const lib = require(__dirname + '/../lib/lib.js');

/**
 * Global variables
 */
var TKbotInfo = {
    'name': 'TKbot',
    'version': '1.0',
};
const CompanyRemoveReasonsInString = ['수동', '자동 삭제', '파산'];
var clientInfo = [];
var ottdClients = {};

// Prepare for OpenTTD clients
let channelsConfig = lib.loadChannelsConfig();
for (let _channelUid in channelsConfig) {
    let _channelConfig = channelsConfig[_channelUid];
    if (_channelConfig.openttd && _channelConfig.openttd.host && _channelConfig.openttd.port && _channelConfig.openttd.password) {
        ottdClients[_channelUid] = {
            connected: false,
            client: new ottd.connection(),
        };
    }
}

// Initialize
exports.init = (data) => {
    let message = data.message;
    let isMod = data.isMod;
    let _oc = ottdClients[data.uid];

    // Connect to OpenTTD server
    if (isMod && lib.isMatch(message, ['!ottd connect', '!ottd start', '!트타 시작', '!오픈트타 시작', '!트타 연결', '!오픈트타 연결'])) {
        if (_oc.connected) {
            console.log('[ottdchat.js] @' + data.uid + ' Already connected');
            return;
        }

        let _channelConfig = lib.loadChannelsConfig(data.uid);
        if (!_channelConfig.openttd || !_channelConfig.openttd.host || !_channelConfig.openttd.port || !_channelConfig.openttd.password) {
            return;
        }

        // Connection host/port
        let openttdHost = _channelConfig.openttd.host;
        let openttdPort = _channelConfig.openttd.port;
        let openttdPassword = _channelConfig.openttd.password;

        try {
            let ottdClient = _oc.client;
            ottdClient.connect(String(openttdHost), Number(openttdPort));
            console.log('[ottdchat.js] Try to connect %s:%d', String(openttdHost), Number(openttdPort));

            ottdClient.on('connect', () => {
                _oc.connected = true;
                ottdClient.authenticate(String(TKbotInfo.name), String(openttdPassword), String(TKbotInfo.version));
            });
            ottdClient.on('authenticate', ocdata => {
                ottdClient.send_update_frequency(ottd.enums.UpdateTypes.CHAT, ottd.enums.UpdateFrequencies.AUTOMATIC);
                ottdClient.send_update_frequency(ottd.enums.UpdateTypes.CLIENT_INFO, ottd.enums.UpdateFrequencies.AUTOMATIC);
                lib.say(data, '[OpenTTD] 채팅 연동을 시작합니다.');
            });
            ottdClient.on('welcome', ocdata => {
                console.log('[ottdchat.js] Welcome to %s(%s) %sserver', ocdata.name, ocdata.version, ocdata.s_dedicated ? 'dedicated ' : '');
                console.log('[ottdchat.js] Map name: %s (with seed %d), landscape is %s and started since %d ago', ocdata.map.name, ocdata.map.seed, ['temperate', 'subarctic', 'tropical', 'toyland'][ocdata.map.landscape], ocdata.map.startdate);
                console.log('[ottdchat.js] Map size is %dx%d', ocdata.map.mapwidth, ocdata.map.mapheight);

                // Get all clients & companies information
                ottdClient.send_poll(ottd.enums.UpdateTypes.CLIENT_INFO, 0xFFFFFFFF);
                ottdClient.send_poll(ottd.enums.UpdateTypes.COMPANY_INFO, 0xFFFFFFFF);
            });
            ottdClient.on('clientjoin', id => {
                lib.say(data, '[OpenTTD] ' + getNick(ottdClient, id) + ' 님이 입장하셨습니다.');
            });
            ottdClient.on('clientinfo', client => {
                clientInfo[client.id] = {
                    'name': client.name,
                    'ip': client.ip,
                    'id': client.id,
                };
            });
            ottdClient.on('clientupdate', client => {
                clientInfo[client.id] = {
                    'name': client.name,
                    'ip': client.ip,
                    'id': client.id,
                };
            });
            ottdClient.on('clientquit', quit_client => {
                if (!clientInfo) {
                    clientInfo = {};
                }

                lib.say(data, '[OpenTTD] ' + getNick(ottdClient, quit_client.id) + ' 님이 퇴장하셨습니다.');
                delete clientInfo[quit_client.id];
            });
            ottdClient.on('companyremove', ocdata => {
                let company_no = ocdata.id * 1 + 1;
                lib.say(data, '[OpenTTD] #' + company_no + '번 회사가 삭제되었습니다 (사유: ' + CompanyRemoveReasonsInString[ocdata.reason] + ')');
            });
            ottdClient.on('chat', ocdata => {
                if (ocdata.id === 1) {
                    return;
                }

                switch (ocdata.action) {
                    case ottd.enums.Actions.JOIN:
                        lib.say(data, '[OpenTTD] ' + getNick(ottdClient, ocdata.id) + ' 님이 입장하셨습니다.');
                        break;
                    case ottd.enums.Actions.LEAVE:
                        lib.say(data, '[OpenTTD] ' + getNick(ottdClient, ocdata.id) + ' 님이 퇴장하셨습니다.');
                        break;
                    case ottd.enums.Actions.SERVER_MESSAGE:
                        lib.say(data, '[OpenTTD] <서버> ' + ocdata.message + '');
                        break;
                    case ottd.enums.Actions.CHAT:
                        lib.say(data, '[OpenTTD] <' + getNick(ottdClient, ocdata.id) + '> ' + ocdata.message + '');
                        break;
                    case ottd.enums.Actions.GIVE_MONEY:
                        lib.say(data, '[OpenTTD] <' + getNick(ottdClient, ocdata.id) + '> ' + ocdata.message + '에 돈을 보냈습니다 (￡' + ocdata.money + ')');
                        break;
                    case ottd.enums.Actions.COMPANY_SPECTATOR:
                        lib.say(data, '[OpenTTD] ' + getNick(ottdClient, ocdata.id) + ' 님이 관전을 시작하셨습니다.');
                        break;
                    case ottd.enums.Actions.COMPANY_JOIN:
                        lib.say(data, '[OpenTTD] ' + getNick(ottdClient, ocdata.id) + ' 님이 ' + ocdata.money + '번 회사에 참여하셨습니다.');
                        break;
                    case ottd.enums.Actions.COMPANY_NEW:
                        lib.say(data, '[OpenTTD] ' + getNick(ottdClient, ocdata.id) + ' 님이 새로운 회사(' + ocdata.money + '번)를 창설하셨습니다.');
                        break;

                    default:
                        console.log(ocdata);
                }
            });
            ottdClient.on('error', err => {
                switch (err) {
                    case 'connectionerror':
                        console.log('[ottdchat.js] 봇을 실행하려고 했으나 서버가 오프라인임', err);
                        break;

                    case 'connectionclose':
                        lib.say(data, '[OpenTTD] 채팅 연동을 종료합니다.');
                        _oc.connected = false;
                        _oc.client = new ottd.connection();
                        break;
                }
            });
        } catch (e) {
            console.log('[ottdchat.js] %s', e);
        }

    // Disconnect
    } else if (isMod && lib.isMatch(message, ['!ottd disconnect', '!ottd stop', '!ottd end', '!트타 중지', '!오픈트타 중지', '!트타 해제', '!오픈트타 해제'])) {
        if (!_oc || !_oc.connected) {
            return;
        }

        // Clean up
        _oc.client.close();
        _oc.connected = false;
        _oc.client = new ottd.connection();

    // Send message to ingame
    } else {
        if (!_oc || !_oc.connected) {
            return;
        }
        if (data.username === 'TKbot') {
            return;
        }
        _oc.client.send_rcon('say "<' + data.username + '> ' + message.replace(/"/ig, '\"') + '"');
    }

    return;
};

var getNick = (oc, id) => {
    if (!oc) {
        return;
    }

    if (!clientInfo[id]) {
        oc.send_poll(ottd.enums.UpdateTypes.CLIENT_INFO, id);
        nick = (id in clientInfo) ? clientInfo[id].name : '???';
    } else {
        nick = clientInfo[id].name;
    }
    return nick;
};
