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
        let platform = $(this).closest('tr').data('platform');
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
                    console.warn(rst);
                    alert(rst.message);
                    return;
                }
                if (platform === 'cime') {
                    location.href = rst.moveTo;
                } else {
                    alert('TKbot이 ' + channelId + ' 채널에 입장하였습니다.');
                }
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
        let platform = $(this).closest('tr').data('platform');
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
                if (channelId) {
                    alert('TKbot이 ' + channelId + ' 채널에서 퇴장하였습니다.');
                } else {
                    alert('TKbot이 퇴장하였습니다.');
                    location.reload();
                }
            },
            error: function(xhr) {
                console.error(xhr);
                let responseData = JSON.parse(xhr.responseText);
                alert(responseData ? responseData.message : xhr.responseText);
            },
        });
    });
});
