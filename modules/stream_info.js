var exports = module.exports = {};

/**
 * requires
 */
const lib = require(__dirname + '/../lib/lib.js');
const axios = require('axios');

/**
 * Global variables
 */
var modules = module.parent.exports.modules;
var channelsConfig = module.parent.exports.channelsConfig;

let msgResponse = {};
let params = {
    adult: false,
    categoryType: "ETC",
    chatActive: true,
    chatAvailableGroup: "ALL",
    defaultLiveTitle: "",
    defaultThumbnailImageUrl: null,
    liveCategory: "talk",
    paidPromotion: false
}

var init = exports.init = async (data) => {
    let t = -1;
    let message = data.message;
    let liveDetail = null;

    // Get stream title
    if (t = lib.startWithCmd(message, ['!방제', '!title', '!샤싣', '!타이틀'])) {
        // chzzk만 지원
        if (data.platform !== 'chzzk') {
            return;
        }

        // Get stream information
        let liveSetting = await data.callback.client.manage.setting(data.to);

        // Change stream title
        if (data.isMod && t.param !== null) {
            let streamTitle = String(t.param).trim();

            if (!streamTitle) {
                lib.say(data, '사용 방법: !title <방제>');
                return;
            } else {
                // Change game
                let new_liveSetting = {
                    // Change
                    defaultLiveTitle: streamTitle,

                    // Live as is
                    categoryType: liveSetting.category.categoryType,
                    liveCategory: liveSetting.category.liveCategory,
                    adult: liveSetting.adult,
                    chatActive: liveSetting.chatActive,
                    chatAvailableGroup: liveSetting.chatAvailableGroup,
                    chatAvailableCondition: liveSetting.chatAvailableCondition,
                    defaultThumbnailImageUrl: liveSetting.defaultThumbnailImageUrl,
                    paidPromotion: liveSetting.paidPromotion,
                }
                await data.callback.client.manage.setting(data.to, new_liveSetting);
                lib.say(data, '방송 제목이 "' + streamTitle + '"(으)로 변경되었습니다.');
                return;
            }
        }

        if (liveSetting && liveSetting.defaultLiveTitle) {
            lib.say(data, '@' + data.username + ' 현재 방제: ' + liveSetting.defaultLiveTitle);
        }

    // Get game
    } else if (t = lib.startWithCmd(message, ['!게임', '!game', '!ㅎ믇', '!주제'])) {
        // chzzk만 지원
        if (data.platform !== 'chzzk') {
            return;
        }

        // Get stream information
        let liveSetting = await data.callback.client.manage.setting(data.to);
        let gameType = null;
        let gameTitle = null;

        switch (liveSetting.category.categoryType) {
            case 'GAME':
                gameType = '게임';
                gameTitle = liveSetting.category.liveCategoryName;
                break;
            case 'ETC':
            default:
                gameType = '주제';
                gameTitle = '토크';
                break;
        }

        // Change game
        if (data.isMod && t.param !== null) {
            let gameTitle = String(t.param).trim();

            if (!gameTitle) {
                lib.say(data, '사용 방법: !game <게임이름>');
                return;
            } else {
                // Search game
                let category = null;
                let categoryName = null;
                let categoryType = 'GAME';
                if (lib.isMatch(gameTitle, ['토크', 'talk', 'ㅅ미ㅏ'])) {
                    categoryType = 'ETC';
                    category = 'talk';
                    categoryName = 'talk';
                } else {
                    // Find game from the lounges
                    const result = await data.callback.client.search.lounges(gameTitle);
                    if (result.totalCount > 0) {
                        categoryType = 'GAME';
                        category = result.lounges[0].originalLoungeId;
                        categoryName = result.lounges[0].loungeName;
                    } else {
                        lib.say(data, '"' + gameTitle + '" 주제를 찾지 못했습니다');
                        return;
                    }
                }

                // Change game
                let new_liveSetting = {
                    // Change
                    categoryType: categoryType,
                    liveCategory: category,

                    // Live as is
                    adult: liveSetting.adult,
                    chatActive: liveSetting.chatActive,
                    chatAvailableGroup: liveSetting.chatAvailableGroup,
                    chatAvailableCondition: liveSetting.chatAvailableCondition,
                    defaultLiveTitle: liveSetting.defaultLiveTitle,
                    defaultThumbnailImageUrl: liveSetting.defaultThumbnailImageUrl,
                    paidPromotion: liveSetting.paidPromotion,
                }
                await data.callback.client.manage.setting(data.to, new_liveSetting);
                lib.say(data, '방송 주제가 "' + categoryName + '"(으)로 변경되었습니다.');
                return;
            }
        }

        lib.say(data, '@' + data.username + ' 현재 방송 주제: ' + gameTitle);

    // uptime
    } else if (lib.startWithCmd(message, ['!uptime', '!업타임', '!방송시간'])) {
        let second = -1;
        let since = null;
        let channelConfig = lib.loadChannelsConfig(data.uid);

        // From chzzk
        if (channelConfig.channels.chzzk) {
            // Get stream information
            let liveDetail = await data.callback.client.live.detail(data.to);

            let n = new Date();
            let m = new Date(liveDetail.openDate);
            if (liveDetail.openDate !== null && liveDetail.closeDate == null) {
                second = Math.floor((n.getTime() - m.getTime()) / 1000);
                since = lib.prettyDate(m).full_str;
            }

        // From twitch
        } else if (channelConfig.channels.twitch) {
            let res = await axios({
                url: 'https://beta.decapi.me/twitch/uptime/' + channelConfig.channels.twitch,
                type: 'GET',
            });
            if (String(res.data).indexOf('is offline') >= 0) {
                second = -1;
            } else {
                second = 0;
                let tmp = String(res.data).split(',');
                for (let i in tmp) {
                    let _tmp = String(tmp[i]).trim().split(' ');
                    switch(_tmp[1]) {
                        case 'days':
                            second += Number(_tmp[0]) * 86400;
                            break;
                        case 'hours':
                            second += Number(_tmp[0]) * 3600;
                            break;
                        case 'minutes':
                            second += Number(_tmp[0]) * 60;
                            break;
                        case 'seconds':
                            second += Number(_tmp[0]);
                            break;
                    }
                }
            }

            let ts = (Math.floor((new Date()).getTime() / 1000) - second) * 1000;
            let ns = new Date();
            ns.setTime(ts);
            since = lib.prettyDate(ns).full_str;

        } else {
            lib.say(data, '@' + data.username + ' 방송 시간을 불러올 수 없습니다');
            return;
        }

        // live
        if (second >= 0) {
            lib.say(data, '@' + data.username + ' 현재 ' + since + ' 부터 지금까지 ' + lib.time2readable(second) + ' 동안 방송 중입니다');

        // not live
        } else {
            lib.say(data, '@' + data.username + ' 현재 방송 중이 아닙니다');
        }
    }
};
