var channelConfigTTS = {};
var ttsQueue = [];
window.debugmode = false;
const config = {
    tts: {
        personality_speed: [1.2, 1.4],   // Speed에 관여
        personality_pitch: [0.9, 1.3],   // Pitch에 관여
        replaceWord: {
            'ㄱㄱ': '고고',
            'ㄱㅅ': '감사',
            'ㄱㅅㄱㅅ': '감사감사',
            'ㄳㄳ': '감사감사',
            'ㄴㅂ': '너 밴',
            'ㅁㅁㄹ ㄷㅁㄹ ㅁㄷㅁㄷ ㅃㅃㅇ': '민머리 대머리 맨들맨들 빡빡이',
            'ㅁㅁㄹ': '민머리',
            'ㄷㅁㄹ': '대머리',
            'ㅃㅃㅇ': '빡빡이',
            'ㅅㄱ': '수고',
            'ㅇㅋ': '오케이',
            'ㅈㅅ': '죄송',
            'ㅂㄷㅂㄷ': '부들부들',
            'ㅅㅈㅎㄹ ㅇㅅㅇ': '삭제해라 애송이',
            'ㅅㅈㅎㄹㅇㅅㅇ': '삭제해라 애송이',
            'ㅅㅈㅎㄹ ㅌㅅㅇ': '삭제해라 텔송이',
            'ㅅㅈㅎㄹㅌㅅㅇ': '삭제해라 텔송이',
            'ㄴㄷㅆ': '네다씹',
            'ㄴㄷㅊ': '네다철',
            'ㄹㅇ루다가': '리얼루다가',
            'ㅇㅇㅈ': '어 인정',
            'ㅇㅈ': '인정',
            'ㅅㅌㅊ': '상타치',
            'ㅎㅌㅊ': '하타치',
            'xpfgk': '텔하',
            'xpfqk': '텔바',
            'TELK': 'telk',
            'OpenRCT2': '오픈롤코투',
            'OpenRCT': '오픈롤코',
            'NewGRF': '뉴지알에프',
            'ㄴㅁㅂㄹㄷ': '너무부럽다',
            'ㄴㅁ ㅂㄹㄷ': '너무 부럽다',
            'ㄴㅁㅂㄹㄸ': '너무부럽따',
            'ㄴㅁ ㅂㄹㄸ': '너무 부럽따',
            '\\^\\^7': '충성 충성',
            'ㅗㅜㅑ': '오우야',
            'ㄱ': '기역',
            'ㄲㄲ': '깔깔',
            'ㄲㅂ': '까비',
            'ㄲㄲㄲ': '깔깔깔',
            'ㄳ': '감사',
            'ㄴ': '니은',
            'ㄷ': '디귿',
            'ㄸ': '쌍디귿',
            'ㄹ': '리을',
            'ㅁ': '미음',
            'ㅂ': '비읍',
            'ㅃ': '쌍비읍',
            'ㅅ': '시옷',
            'ㅆ': '쌍시옷',
            'ㅇ': '이응',
            'ㅈ': '지읒',
            'ㅉ': '쌍지읒',
            'ㅊ': '치읓',
            'ㅋ': '키읔',
            'ㅌ': '티읕',
            'ㅍ': '피읖',
            'ㅎ': '히흫',
            'ㅏ': '아',
            'ㅐ': '애',
            'ㅑ': '야',
            'ㅒ': '얘',
            'ㅓ': '어',
            'ㅔ': '에',
            'ㅕ': '여',
            'ㅖ': '예',
            'ㅗ': '오',
            'ㅘ': '와',
            'ㅙ': '왜',
            'ㅚ': '외',
            'ㅛ': '요',
            'ㅜ': '우',
            'ㅞ': '웨',
            'ㅠ': '유',
            'ㅡ': '으',
            'ㅢ': '의',
            'ㅣ': '이',
        },
    },
};

$(document).ready(async function() {
    // 채널 ID
    var channelId = window.location.hash.replace(/^#/ig, '');
    if (!channelId) {
        alert('잘못된 접근입니다');
        return;
    }

    // TTS 설정 불러오기
    channelConfigTTS = await $.getJSON('/config/tts/' + channelId + '.json');

    var socket = io('/chat');
    if (!socket) {
        alert('접속 실패');
    }

    // join to channel
    socket.emit('channelId', channelId);

    // on message
    socket.on('data', (data) => {
        let username = String(data.username);
        let message = String(data.message).trim();

        // 느낌표로 시작하는 메시지는 읽지 않음
        if (message.match(/^!.*/g)) {
            return;
        }

        // [OpenTTD] 생략
        if (message.match(/^\[OpenTTD\] /ig)) {
            if (message.match(/^\[OpenTTD\] <(.+?)> /ig)) {
                if (message.match(/^\[OpenTTD\] <(.+?)> (.+?)에 돈을 보냈습니다 \(￡([0-9,]+)\)/ig)) {
                    return;
                }
                message = message.replace(/^\[(OpenTTD|Minecraft)\] <(.+?)> (.+?)/ig, '$3');
            } else {
                return;
            }
        }

        // Ban user
        for (let i in channelConfigTTS.banuser) {
            let _banUser = channelConfigTTS.banuser[i];
            if (username == _banUser) {
                return;
            }
        }

        // Ban word
        for (let i in channelConfigTTS.banword) {
            let _banWord = channelConfigTTS.banword[i];
            if (message.indexOf(_banWord) >= 0) {
                return;
            }
        }

        // 채팅 관리자가 아니면 120자가 넘는 메시지는 읽지 않음
        if (!data.isMod && message.length > 120) {
            return;
        }

        // 구글 음성합성 초기화
        if ('speechSynthesis' in window) {
            if (!message) {
                return false;
            }

            // Personality 적용
            let personality_int1 = 0;
            let personality_int2 = 0;
            for (let i = 0; i < username.length; i++) {
                personality_int1 += username.charCodeAt(i);
                personality_int2 |= username.charCodeAt(i);
            }
            personality_int1 %= ((config.tts.personality_speed[1] * 100 - config.tts.personality_speed[0] * 100) + 1);
            personality_int2 %= ((config.tts.personality_pitch[1] * 100 - config.tts.personality_pitch[0] * 100) + 1);

            let p_speed = 1 + (personality_int1 / 100) - (1 - config.tts.personality_speed[0]);
            p_speed = Math.floor(Math.min(p_speed, config.tts.personality_speed[1]) * 100) / 100;

            let p_pitch = 1 + (personality_int2 / 100) - (1 - config.tts.personality_pitch[0]);
            p_pitch = Math.floor(Math.min(p_pitch, config.tts.personality_pitch[1]) * 100) / 100;

            // 링크는 "링크"로 읽음
            message = message.replace(/https?:\/\/clips\.twitch\.tv\/([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, '클립');
            message = message.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, '링크');

            message = message.replace(/\?{2,}/g, '?');   // 물음표는 한 번만 읽음
            message = message.replace(/(\?!){2,}/g, '?!');
            message = message.replace(/(!\?){2,}/g, '!?');

            // 이모티콘 치환
            if (data.emotes && Object.keys(data.emotes).length > 0) {
                for (let _emoteKey in data.emotes) {
                    let _emoteUrl = data.emotes[_emoteKey];

                    switch (data.platform) {
                        case 'chzzk':
                            message = message.replace(new RegExp('\{:' + _emoteKey + ':\}', 'ig'), '');
                            break;
                        case 'twitch':
                            message = message.replace(new RegExp(_emoteKey, 'ig'), _emoteKey);
                        default:
                    }
                }
            }

            // #(int)는 읽지 않음
            message = message.replace(/^#([0-9]+)/g, '');
            message = message.replace(/[\[\]\(\)\{\}<>]/g, '');   // ? [ ] { } ( )는 읽지 않음
            message = message.replace(/\ud83d[\ude00-\ude4f]/g, '');   // 이모지는 읽지 않음
            message = message.replace(/~{2,}/g, '~');   // 물결표는 한번만 읽음
            message = message.replace(/(키읔){3,}/g, '키읔키읔키읔');   // ㅋ이 3번 이상 있으면 3번만 읽음
            message = message.replace(/(.)\1{9,}/g, '');   // 이외 모든 글자가 10번 이상 연속으로 있으면 삭제(읽지 않음)
            message = message.replace(/SSSsss/g, '');   // 트위치 크리퍼 이모티콘 SSSsss는 읽지 않음
            message = message.replace(/&(.*?);/g, '');   // &~~~;와 같은 엔티티 문자는 읽지 않음

            // 일부 단어는 바꾸어서 읽음
            for (let _word in config.tts.replaceWord) {
                message = message.replace(new RegExp(_word, 'g'), config.tts.replaceWord[_word]);
            }

            // 언어 탐지
            let lang = 'en-GB';

            if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(message)) {   // 한국어
                lang = 'ko-KR';
            } else if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(message)) {   // 일본어
                lang = 'ja-JP';
            } else if (/[\u0400-\u04FF]/.test(message)) {   // 러시아어
                lang = 'ru-RU';
            } else {
                lang = 'en-US';
            }

            // 언어 목소리 선택
            let i = 0;
            let voice_lang = null;
            speechSynthesis.getVoices().forEach(function (voice) {
                if (voice.name.indexOf('Google') >= 0 && voice.lang == lang) {
                    voice_lang = i;
                }
                i++;
            });
            if (voice_lang === null) {
                voice_lang = 0;
            }

            // 재생
            let msg = new SpeechSynthesisUtterance(message);
            msg.type = 'default';
            msg.message = message;
            msg.from = username;
            msg.lang = lang;
            msg.voice = window.speechSynthesis.getVoices()[voice_lang];
            msg.rate = p_speed;
            msg.pitch = p_pitch;
            msg.onstart = function (event) {
                if (typeof event.utterance.from == 'undefined' || event.utterance.from == '') {
                    event.utterance.from = 'Unknown';
                }
            }
            msg.volume = 0.8;
            msg.onend = function (event) {
                window.speechSynthesis.cancel();
                if (window.debugmode) {
                    console.log('msg read event');
                }
                if (window.debugmode) {
                    console.log(event);
                }
            }
            ttsQueue.push(msg);
        } else {
            console.error('No speechSynthesis');
        }

        playTTSinQueue();
    });

    socket.on('error', err => {
        console.log(err);
    });
});


// 재생
function playTTSinQueue() {
    // TTS가 재생 중이면 대기
    if (window.speechSynthesis.speaking) {
        setTimeout(playTTSinQueue, 100);
        return;
    }

    // 재생할 TTS가 없으면 대기
    let ttsobj = ttsQueue.shift();
    if (typeof ttsobj === 'undefined') {
        playTimeCount = 0;
        setTimeout(playTTSinQueue, 100);
        return;
    }

    let message = ttsobj.message;
    console.log('Say "%s"', message);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ttsobj);

    setTimeout(playTTSinQueue, 100);
}

// 끊기
function cancelTTS() {
    window.speechSynthesis.cancel();
    // playTTS({
    //     type: 'google',
    //     string: '큐를 비웠습니다',
    //     speed: 1.3,
    //     pitch: 1,
    //     ignoreKor: false,
    //     nick: 'SYSTEM'
    // });
}

// 재생
function playText(ttsobj) {
    if (!('speechSynthesis' in window)) {
        console.error('There is no speechSynthesis!');
        return;
    }

    window.speechSynthesis.speak(ttsobj);
}
