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

    // Get stream title
    if (t = lib.startWithCmd(message, ['!방제', '!title', '!샤싣', '!타이틀'])) {
        const liveDetail = await data.callback.client.live.detail(data.to);

        // Change stream title
        if (data.isMod && t.param !== null) {
            let liveSetting = await data.callback.client.live.setting(data.to);
            let streamTitle = String(t.param).trim();

            if (!streamTitle) {
                data.callback[data.method]('사용 방법: !title <방제>');
                return;
            } else {
                liveSetting.defaultLiveTitle = streamTitle;
                await data.callback.client.live.setting(data.to, liveSetting);
                data.callback[data.method]('방송 제목이 "' + streamTitle + '"(으)로 변경되었습니다.');
                return;
            }
        }

        if (liveDetail && liveDetail.liveTitle) {
            data.callback[data.method]('현재 방제: ' + liveDetail.liveTitle);
        }

    // Get game
    } else if (t = lib.startWithCmd(message, ['!게임', '!game', '!ㅎ믇', '!주제'])) {
        const liveDetail = await data.callback.client.live.detail(data.to);
        let gameType = null;
        let gameTitle = null;

        switch (liveDetail.categoryType) {
            case 'GAME':
                gameType = '게임';
                // gameTitle = liveSetting.category.liveCategoryName;
                gameTitle = liveDetail.liveCategoryValue;
                break;
            case 'ETC':
            default:
                gameType = '주제';
                gameTitle = '토크';
                break;
        }

        // Change game
        if (data.isMod && t.param !== null) {
            let liveSetting = await data.callback.client.live.setting(data.to);
            let gameTitle = String(t.param).trim();

            if (!gameTitle) {
                data.callback[data.method]('사용 방법: !game <게임이름>');
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
                        data.callback[data.method]('"' + gameTitle + '" 주제를 찾지 못했습니다');
                        return;
                    }
                }

                // Change game
                re_liveSetting = liveSetting;
                re_liveSetting.categoryType = categoryType;
                re_liveSetting.liveCategory = category;
                re_liveSetting.liveCategoryName = categoryName;
                await data.callback.client.live.setting(data.to, re_liveSetting);
                data.callback[data.method]('방송 주제가 "' + categoryName + '"(으)로 변경되었습니다.');
                return;
            }
        }

        data.callback[data.method]('현재 방송 주제: ' + gameTitle);
    
    // uptime
    } else if (lib.startWithCmd(message, ['!uptime', '!업타임', '!방송시간'])) {
        const liveDetail = await data.callback.client.live.detail(data.to);

        // live
        if (liveDetail.openDate !== null && liveDetail.closeDate === null) {
            let n = new Date();
            let m = new Date(liveDetail.openDate);
            let t = Math.floor((n.getTime() - m.getTime()) / 1000);

            let streamUptime = [];
            let d = Math.floor(t / 86400);
            let h = Math.floor((t % 86400) / 3600);
            let i = Math.floor((t % 3600) / 60);
            let s = (t % 60);
            if (d > 0) {
                streamUptime.push(d + '일')
            }
            if (h > 0) {
                streamUptime.push(h + '시간')
            }
            if (i > 0) {
                streamUptime.push(i + '분')
            }
            if (s > 0) {
                streamUptime.push(s + '초')
            }
            data.callback[data.method]('현재 ' + streamUptime.join(' ') + ' 동안 방송 중입니다');
        
        // not live
        } else {
            data.callback[data.method]('현재 방송 중이 아닙니다');
        }
    }
};
