$(document).ready(function() {
    // Join
    $('.join').click(function(e) {
        let _input = $(this).parent().siblings().eq(1).find('input');
        let platform = _input.attr('name');
        let channelId = _input.val();

        $.ajax({
            url: '/join',
            type: 'post',
            dataType: 'json',
            data: {
                'platform': platform,
                'channelId': channelId,
            },
            success: function(rst) {
                if (rst.state !== 'success') {
                    alert(rst.message);
                    return;
                }
                alert('TKbot이 ' + channelId + ' 채널에 입장하였습니다.');
            },
            error: function(xhr) {
                console.error(xhr);
                alert(xhr.responseText);
            },
        });
    });

    // Quit
    $('.quit').click(function(e) {
        let _input = $(this).parent().siblings().eq(1).find('input');
        let platform = _input.attr('name');
        let channelId = _input.val();

        $.ajax({
            url: '/quit',
            type: 'post',
            dataType: 'json',
            data: {
                'platform': platform
            },
            success: function(rst) {
                if (rst.state !== 'success') {
                    alert(rst.message);
                    return;
                }
                alert('TKbot이 ' + channelId + ' 채널에서 퇴장하였습니다.');
            },
            error: function(xhr) {
                console.error(xhr);
                alert(xhr.responseText);
            },
        });
    });
});
