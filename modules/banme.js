var exports = module.exports = {};

/**
 * requires
 */
const lib = require(__dirname + '/../lib/lib.js');
const chzzk = require('chzzk');
const fetch = require('node-fetch');
const { ChzzkClient } = chzzk;

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;

/**
 * !banme
 * @param Object data                   Message data object
 */
var init = exports.init = async (data) => {
    return;

    let message = data.message;
    if (t = lib.startWithCmd(message, ['!나차단', '!banme'])) {
        // chzzk
        if (data.platform === 'chzzk') {
            // Profile of bot itself
            const botProfile = await data.callback.selfProfile();
        
            if (!chzzk.isChannelManager(botProfile) && !chzzk.isChatManager(botProfile)) {
                data.callback.sendChat('봇에 채널 관리자 또는 채팅 운영자 권한이 없습니다.');
                return;
            }
            
            await data.client.fetch('https://api.chzzk.naver.com/manage/v1/channels/' + data.to + '/temporary-restrict-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetId: data.userid,
                    chatChannelId: data.callback.chatChannelId,
                })
            }).then(response => response.json()
                .then(resData => {
                    if (resData.code === 200) {
                        data.callback.sendChat('@' + data.username + ' 차단해달래서 차단해드렸습니다 ^^');
                    } else {
                        if (resData.message === '운영진은 임시제한 할 수 없습니다. 유저로 등급 변경 후 시도해주세요.') {
                            resData.message = '스트리머나 채널 관리자는 나차단을 할 수 없습니다.';
                        }
                        data.callback.sendChat(resData.message);
                    }
            }));
            
        // youtube
        } else if (data.platform === 'youtube') {

        // twitch
        } else if (data.platform === 'twitch') {

        }
    }
};