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

/**
 * TTS
 * @param Object data                   Message data object
 */
var init = exports.init = (data) => {
    let message = data.message;

    // Managing response command
    if (data.isMod) {
        // // Enable/Disable TTS
        // if (t = lib.startWithCmd(message, ['!tts on', '!tts start', '!tts enable'])) {
        //     let channelConfig = lib.loadChannelConfig(data.uid);
        //     channelConfig.tts.enable = true;
        //     lib.saveChannelConfig(data.uid, channelConfig);
        // } else if (t = lib.startWith(message, ['!tts off', '!tts end', '!tts disable'])) {
        //     let channelConfig = lib.loadChannelConfig(data.uid);
        //     channelConfig.tts.enable = false;
        //     lib.saveChannelConfig(data.uid, channelConfig);
        // }

        // Ban/Unban a word
        if (t = lib.startWithCmd(message, ['!tts ban ', '!tts 밴 ', '!tts 차단 '])) {
            let channelConfig = lib.loadChannelConfig(data.uid);
            let banWord = String(t.param).trim();
            if (channelConfig.tts.banword.indexOf(banWord) < 0) {
                channelConfig.tts.banword.push(banWord);
                lib.saveChannelConfig(data.uid, channelConfig);
                lib.say(data, '이제 "' + banWord + '" 단어를 TTS로 읽지 않습니다.');
            }
        } else if (t = lib.startWithCmd(message, ['!tts unban ', '!tts 언밴 ', '!tts 차단해제 '])) {
            let isExecuted = false;
            let channelConfig = lib.loadChannelConfig(data.uid);
            let banWord = String(t.param).trim();
            let new_banword = [];
            for (let i in channelConfig.tts.banword) {
                let _banWord = channelConfig.tts.banword[i];
                if (banWord == _banWord) {
                    isExecuted = true;
                    delete channelConfig.tts.banword[i];
                } else if (_banWord) {
                    new_banword.push(_banWord);
                }
            }
            if (isExecuted) {
                channelConfig.tts.banword = new_banword;
                lib.saveChannelConfig(data.uid, channelConfig);
                lib.say(data, '이제 "' + banWord + '" 단어를 TTS로 읽습니다.');
            }
        }

        // Ban/Unban a user
        if (t = lib.startWithCmd(message, ['!tts userban ', '!tts 유저밴 ', '!tts 유저차단 '])) {
            let channelConfig = lib.loadChannelConfig(data.uid);
            let banUser = String(t.param).trim();
            if (channelConfig.tts.banuser.indexOf(banUser) < 0) {
                channelConfig.tts.banuser.push(banUser);
                lib.saveChannelConfig(data.uid, channelConfig);
                lib.say(data, banUser + ' 유저의 TTS 읽기를 차단하였습니다.');
            }
        } else if (t = lib.startWithCmd(message, ['!tts userunban ', '!tts 유저언밴 ', '!tts 유저차단해제 '])) {
            let isExecuted = false;
            let channelConfig = lib.loadChannelConfig(data.uid);
            let banUser = String(t.param).trim();
            let new_banuser = [];
            for (let i in channelConfig.tts.banuser) {
                let _banUser = channelConfig.tts.banuser[i];
                if (banUser == _banUser) {
                    isExecuted = true;
                    delete channelConfig.tts.banuser[i];
                } else if (_banUser) {
                    new_banuser.push(_banUser);
                }
            }
            if (isExecuted) {
                channelConfig.tts.banuser = new_banuser;
                lib.saveChannelConfig(data.uid, channelConfig);
                lib.say(data, banUser + ' 유저의 TTS 읽기 차단을 해제하였습니다.');
            }
        }
    }
};
