var exports = module.exports = {};

/**
 * requires
 */
const lib = require(__dirname + '/../lib/lib.js');

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var channelsConfig = module.parent.exports.channelsConfig;

let msgResponse = {};

/**
 * Load the response data
 */
var loadResponseData = (platform, channelUid) => {
    let channelConfig = lib.loadChannelsConfig(channelUid);
    return channelConfig.response;
};

/**
 * Save the response data
 */
var saveResponseData = (platform, channelUid, responseData) => {
    let channelConfig = lib.loadChannelsConfig(channelUid);
    channelConfig.response = responseData;
    return lib.saveJSON(__dirname + '/../config/channels/' + channelUid + '.json', channelConfig);
}

/**
 * Find alias of the command. Terminate more than five loops
 * @param
 */
var findAlias = (msg, alias) => {
    let rst = msg;
    let command_list = Object.keys(alias);
    let t = 5;
    while (t > 0) {
        // alias가 있으면 alias로 변경
        let idx = command_list.indexOf(rst);
        if (idx >= 0) {
            rst = alias[rst];

        // alias가 없으면 마지막 변환물을 반환
        } else {
            if (lib.startWith(rst, '!')) {
                return rst;
            } else {
                return '!say ' + rst;
            }
        }
        t--;
    }

    // t번 넘어가면 무한 루프로 간주하고 원문 출력
    return msg;
}

/**
 * Response
 * @param Object data                   Message data object
 */
var init = exports.init = (data) => {
    let message = data.message;

    // Only response when the message starts with !
    if (!lib.startWith(message, '!')) {
        return;
    }

    // load response data
    msgResponse = loadResponseData(data.platform, data.uid);

    let t = -1;
    message = findAlias(message, msgResponse);

    // Say
    if (t = lib.startWith(message, '!say ')) {
        lib.say(data, String(t).trim());
        return;
    }

    // Managing response command
    if (data.isMod) {
        // Add a command
        if (t = lib.startWith(message, ['!command add ', '!명령어 추가 '])) {
            let _tmp = String(t).split(' ');
            let commandToAddCmd = String(_tmp[0]).trim();
            delete _tmp[0];
            let commandToAddRes = String(_tmp.join(' ')).trim();

            // Check if it is already exist command
            if (Object.keys(msgResponse).indexOf(commandToAddCmd) >= 0) {
                lib.say(data, '"' + commandToAddCmd + '" 명령어를 추가할 수 없습니다! ... 이미 존재하는 명령어입니다');
                return;
            } else {
                // 파일 쓰기
                msgResponse[commandToAddCmd] = commandToAddRes;
                saveResponseData(data.platform, data.uid, msgResponse);
                lib.say(data, '"' + commandToAddCmd + '" 명령어가 정상적으로 추가되었습니다.');
            }

        // Edit a command
        } else if (t = lib.startWith(message, ['!command edit ', '!명령어 수정 '])) {
            let _tmp = String(t).split(' ');
            let commandToAddCmd = String(_tmp[0]).trim();
            delete _tmp[0];
            let commandToAddRes = String(_tmp.join(' ')).trim();

            // 이미 존재하는 명령어인지 확인
            if (Object.keys(msgResponse).indexOf(commandToAddCmd) < 0) {
                lib.say(data, '"' + commandToAddCmd + '" 명령어를 수정할 수 없습니다! ... 존재하지 않는 명령어입니다');
                return;
            } else {
                // 파일 쓰기
                msgResponse[commandToAddCmd] = commandToAddRes;
                saveResponseData(data.platform, data.uid, msgResponse);
                lib.say(data, '"' + commandToAddCmd + '" 명령어가 정상적으로 수정되었습니다.');
            }

        // Delete a command
        } else if (t = lib.startWith(message, ['!command del ', '!command delete ', '!command remove ', '!명령어 삭제 ', '!명령어 제거 '])) {
            let commandToDelCmd = String(t).trim();
            for (let _commandPool in msgResponse) {
                if (lib.isMatch(commandToDelCmd, _commandPool.split(','))) {
                    delete msgResponse[_commandPool];
                }
            }

            // 파일 쓰기
            saveResponseData(data.platform, data.uid, msgResponse);
            lib.say(data, commandToDelCmd + ' 명령어가 정상적으로 삭제되었습니다.');
        }
    }

    // 다시 불러오기
    if (lib.isMatch(message, ['!command reload', '!command refresh', '!명령어 새로고침', '!명령어 불러오기'])) {
        msgResponse = loadResponseData(data.platform, data.uid);
        lib.say(data, '자동 응답을 다시 불러왔습니다.');
    }
};
