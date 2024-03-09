var channelConfigDccon = {};
var dcconKeywords = [];
var dcConsData = [];
var twitchConsUrlTemplate = "https://static-cdn.jtvnw.net/emoticons/v2/";

$(document).ready(async function() {
    // 채널 ID
    var channelId = window.location.hash.replace(/^#/ig, '');
    if (!channelId) {
        alert('잘못된 접근입니다');
        return;
    }

    var socket = io('/chat');
    if (!socket) {
        alert('접속 실패');
    }

    // join to channel
    socket.emit('channelId', channelId);

    // on message
    socket.on('data', function (data) {
        addMessage(data);
    });

    // on blind
    socket.on('blind', function (data) {
        blindMessage(data);
    });

    // 파라미터 파싱
    let params = {};
    let tmp1 = window.location.href.split('#', 2);
    let tmp2 = String(tmp1[0]).split('?', 2);
    if (tmp2.length > 1) {
        let paramsTmp = String(tmp2[1]).split('&');
        for (let i in paramsTmp) {
            let tmp3 = String(paramsTmp[i]).split('=', 2);
            params[tmp3[0]] = tmp3[1];
        }
    }

    // 채팅 테마
    if (Object.keys(params).indexOf('theme') >= 0) {
        let chatTheme = String(params.theme).replace(/[^0-9a-zA-Z\-_\.]/ig, '');
        $('head link.theme').attr('href', './css/chat/' + chatTheme + '.css');
    }

    // 디씨콘 불러오기
    channelConfigDccon = await $.getJSON('/config/chat/' + channelId + '.json');

    // 디씨콘 불러오기
    let dcconScript = document.createElement('script');
    dcconScript.src = channelConfigDccon.dccon.baseUrl + channelConfigDccon.dccon.js;
    document.body.appendChild(dcconScript);
    dcconScript.onload = function () {
        dcconKeywords = [];
        for (let index in dcConsData) {
            for (let index2 in dcConsData[index].keywords) {
                dcconKeywords.push(dcConsData[index].keywords[index2]);
            }
        }
        dcconKeywords.sort(function (a, b) {
            return b.length - a.length;
        });
    };
});


/**
 * addMessage
 */
var numChat = 0;
const numChatMax = 20;
const fadeoutTime = 60;
function addMessage(data) {
    const chatWrap = $('#chatWrap');
    console.log(data);

    let message = data.message.replace(/</ig, '&lt;');

    // 넘치는 메세지를 삭제
    if (++numChat > numChatMax) {
        let first = chatWrap.find('.chat').eq(0);
        first.remove();
        numChat--;
    }

    // 채팅 테마 변경
    if (message.startsWith('!theme ') || message.startsWith('!테마 ')) {
        let chatTheme = String(message).replace(/^!(theme|테마) /ig, '').replace(/[^0-9a-zA-Z\-_\.]/ig, '');
        console.log(chatTheme);
        $('head link.theme').attr('href', './css/chat/' + chatTheme + '.css');
        return;
    }

    // 그 외 느낌표(!)로 시작하는 명령어 무시
    if (data.message.substring(0, 1) === '!') {
        return;
    }

    // OpenTTD 채팅 치환
    if (message.substring(0, 9) === '[OpenTTD]') {
        message = message.substr(10).trim();
    }

    // 이모티콘 치환
    if (data.emotes && Object.keys(data.emotes).length > 0) {
        for (let _emoteKey in data.emotes) {
            let _emoteUrl = data.emotes[_emoteKey];

            switch (data.platform) {
                case 'chzzk':
                    message = message.replace(new RegExp('\{:' + _emoteKey + ':\}', 'ig'), '<img src="' + _emoteUrl + '" alt="' + _emoteKey + '" class="emote" />');
                    break;

                case 'twitch':
                    message = message.replace(new RegExp(_emoteKey, 'ig'), '<img src="' + _emoteUrl + '" alt="' + _emoteKey + '" class="emote" />');
                    break;
                default:
            }
        }
    }

    // 디씨콘 치환
    message = applyDccon(message);

    let chatbox = $('<div class="chat"></div>')
        .attr('data-userid', data.userid)
        .attr('data-time', data.time)
        ;
    let chatbox_header = $('<div class="header"></div>');
    let chatbox_header_platform = $('<div class="platform"></div>');
    switch (data.platform) {
        case 'chzzk':
            chatbox_header_platform.addClass('chzzk');
            break;
        case 'youtube':
            chatbox_header_platform.addClass('youtube');
            break;
        case 'twitch':
            chatbox_header_platform.addClass('twitch');
            break;
        case 'kick':
            chatbox_header_platform.addClass('kick');
            break;
        default:
    }
    let chatbox_header_username = $('<div class="username"></div>')
        .html(data.username)
        ;
    let chatbox_message = $('<div class="message"></div>')
        .html(message)
        ;

    chatbox_header.append(chatbox_header_platform, chatbox_header_username);
    chatbox.append(chatbox_header, chatbox_message);
    chatbox
        .delay(fadeoutTime * 1000)
        .fadeOut(100)
        // .hide()
        ;
    chatWrap.append(chatbox);
}

/**
 * blindMessage
 */
function blindMessage(data) {
    let chatbox = $('#chatWrap .chat[data-userid="' + data.userid + '"][data-time="' + data.time + '"]');
    console.log(chatbox);
    let chatbox_message = chatbox.find('.message');
    chatbox_message.html('<del>삭제된 메시지</del>');
}

/**
 * applyDccon
 */
function applyDccon(message) {
    for (let _index in dcconKeywords) {
        var keyword = dcconKeywords[_index];
        var dcconPos = message.toLowerCase().indexOf('~' + keyword.toLowerCase());
        if (dcconPos != -1) {
            message = message.replace(
                new RegExp('~(' + keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')([BCHGVXRLISM]*)', 'ig'),
                function(m, dcconKeyword, dcconAdditionalStyle) {
                    var dcconBackgroundImage = [];
                    dcconBackgroundImage.push('url(' + channelConfigDccon.dccon.baseUrl + channelConfigDccon.dccon.image + dcConsData.find(function(element) {
                        return element.keywords.indexOf(keyword) != -1;
                    }).name + ')');
                    let specialStyle = [];
                    let specialClass = [];
                    let filterStyle = [];
                    let dcconStyle = '';
                    let additionalTags = '';
                    let flip = { h: false, v: false };
                    let mirror = false;
                    loop:
                    for (var s = 0; s < dcconAdditionalStyle.length; s++) {
                        dcconStyle = dcconAdditionalStyle.charAt(s).toUpperCase();
                        switch (dcconStyle) {
                            case 'B':
                                filterStyle.push('blur(5px)');
                                break;
                            case 'I':
                                filterStyle.push('invert(1)');
                                break;
                            case 'S':
                                filterStyle.push('sepia(1)');
                                break;
                            case 'H':
                                flip.h = true;
                                break;
                            case 'V':
                                flip.v = true;
                                break;
                            case 'G':
                                filterStyle.push('grayscale()');
                                break;
                            case 'X':
                                dcconBackgroundImage.push('url(/img/X.png)');
                                break;
                            case 'C':
                                dcconBackgroundImage.push('url(/img/Censored.png)');
                                break;
                            case 'L':
                            case 'R':
                                flip.h = false;
                                specialClass.push('dccon' + dcconStyle);
                                mirror = dcconStyle;
                                break;
                            case 'M':
                                specialClass.push('dcconM');
                                break;
                            default:
                                break loop;
                        }
                    }
                    if (mirror === 'R') {
                        if (flip.v) {
                            specialStyle.push('transform: scale(-1, -1);');
                        }
                    } else {
                        if (flip.h && flip.v) {
                            specialStyle.push('transform: scale(-1, -1);');
                        } else if (flip.h) {
                            specialStyle.push('transform: scaleX(-1);');
                        } else if (flip.v) {
                            specialStyle.push('transform: scaleY(-1);');
                        }
                    }

                    if (filterStyle.length > 0) {
                        specialStyle.push('filter: ' + filterStyle.join(' ') + ';');
                    }
                    dcconBackgroundImage.reverse();

                    return '<div class="dccon' + (specialClass.length > 0 ? ' ' + specialClass.join(' ') : '') + '"'
                        + ' style="background-image: ' + dcconBackgroundImage.join(',') + '; ' + (specialStyle.length > 0 ? ' ' + specialStyle.join(' ') : '') + '" />'
                        + additionalTags + '</div>';
                }
            );
        }
    }

    return message;
}
