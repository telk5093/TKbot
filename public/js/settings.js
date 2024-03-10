function confirmSettings() {
    let frm = document.frm;
    if (frm.password || frm.password2) {
        if (from.password != frm.password2) {
            alert('비밀번호 변경과 비밀번호 변경 확인 란이 일치하지 않습니다.');
            return false;
        }
    }
    return true;
}

var dcConsData = [];
async function checkDccon(baseUrl, js, image) {
    let dcconImage = $('#dcconImage');
    dcconImage.html('정상이 아닙니다');

    // 디씨콘 불러오기
    let dcconScript = document.createElement('script');
    dcconScript.src = baseUrl + js;
    document.body.appendChild(dcconScript);
    dcconScript.onload = function () {
        let first_dcconImage = baseUrl + image + dcConsData[0].name;
        dcconImage.html('<img src="' + first_dcconImage + '" width="30" onload="this.outerHTML = \'정상입니다\';" onerror="this.outerHTML = \'정상이 아닙니다\';" />');
    };
}

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
