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
 * Response
 * @param Object data                   Message data object
 * @param function callback             A function to send message
 */
var init = exports.init = async (data) => {
    let message = data.message;
    if (t = lib.startWithCmd(message, ['!팔로우', '!follow'])) {
        // chzzk
        if (data.platform === 'chzzk') {
            if (userList[data.userid].followed) {
                let n = new Date();
                let m = new Date(userList[data.userid].followed);
                let second = Math.floor((n.getTime() - m.getTime()) / 1000);
                data.callback[data.method]('@' + data.username + ' 님은 팔로우한지 ' + lib.time2readable(second) + ' 지났습니다.')
            } else if (userList[data.userid].isStreamer) {
                data.callback[data.method]('@' + data.username + ' 님은 스트리머입니다.');
            } else {
                data.callback[data.method]('@' + data.username + ' 님은 팔로우하지 않았습니다.');
            }
            // console.log(userList[data.userid]);
        
        // youtube
        } else if (data.platform === 'youtube') {

        // twitch
        } else if (data.platform === 'twitch') {

        }
    }
};