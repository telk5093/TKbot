var exports = module.exports = {};

/**
 * requires
 */
const lib = require(__dirname + '/../lib/lib.js');
// const chzzk = require('chzzk');
// const { ChzzkClient } = chzzk;

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var userList = module.parent.exports.userList;

/**
 * !follow
 * @param Object data                   Message data object
 */
var init = exports.init = async (data) => {
    let message = data.message;
    if (t = lib.startWithCmd(message, ['!팔로우', '!follow'])) {
        // chzzk, twtich
        if (data.platform === 'chzzk' || data.platform === 'twitch') {
            if (userList[data.userid].followed) {
                let n = new Date();
                let m = new Date(userList[data.userid].followed);
                let second = Math.floor((n.getTime() - m.getTime()) / 1000);
                lib.say(data, '@' + data.username + ' 님은 팔로우한지 ' + lib.time2readable(second) + ' 지났습니다.')
            } else if (userList[data.userid].isStreamer) {
                lib.say(data, '@' + data.username + ' 님은 스트리머입니다.');
            } else {
                lib.say(data, '@' + data.username + ' 님은 팔로우하지 않았습니다.');
            }
        
        // youtube
        } else if (data.platform === 'youtube') {

        }
    }
};