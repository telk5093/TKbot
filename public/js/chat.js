(function() {
    var socket = io('/chat');
    if (!socket) {
        alert('접속 실패');
    }

    // 채널 ID
    var channelId = window.location.hash.replace(/^#/ig, '');

    if (!channelId) {
        alert('잘못된 접근입니다');
        return;
    }

    // join to channel
    socket.emit('channelId', channelId);

    // on message
    socket.on('data', function(data) {
        console.log(data);
        addMessage(data);
    });

    // on blind
    socket.on('blind', function(data) {
        blindMessage(data);
    });
})();


/**
 * addMessage
 */
var numChat = 0;
const numChatMax = 3;
const fadeoutTime = 10;
function addMessage(data) {
    let chatWrap = $('#chatWrap');

    // 넘치는 메세지를 삭제
    if (++numChat > numChatMax) {
        let first = chatWrap.find('.chat').eq(0);
        first.remove();
        numChat--;
    }

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
        .html(data.message)
    ;

    chatbox_header.append(chatbox_header_platform, chatbox_header_username);
    chatbox.append(chatbox_header, chatbox_message);
    chatbox
        .delay(fadeoutTime * 1000)
        .fadeOut()
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
