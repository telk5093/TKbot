var ttsQueue = [];
const config = {
    tts: {
        personality_speed: [1.2, 1.4],   // Speed에 관여
        personality_pitch: [0.9, 1.3],   // Pitch에 관여
    },
};

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
    socket.on('data', (data) => {
        // 구글 음성합성 초기화
        if ('speechSynthesis' in window) {
            if (!data.message) {
                return false;
            }

            // 재생
            let msg = new SpeechSynthesisUtterance(data.message);

            // 언어 탐지
            let lang = 'en-GB';

            if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(data.message)) {   // 한국어
                lang = 'ko-KR';
            } else if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(data.message)) {   // 일본어
                lang = 'ja-JP';
            } else if (/[\u0400-\u04FF]/.test(data.message)) {   // 러시아어
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

            // Personality 적용
            let username = String(data.username);
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

            // console.log(lang, voice_lang, window.speechSynthesis.getVoices()[voice_lang]);

            msg.type = 'default';
            msg.message = data.message;
            msg.from = data['display-name'];
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
})();


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
        setTimeout(playTTSinQueue, 100);
        return;
    }

    let message = ttsobj.message;
    console.log('Say "%s"', message);
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
function playText(tttsobj) {
    if (!('speechSynthesis' in window)) {
        console.error('There is no speechSynthesis!');
        return;
    }

    window.speechSynthesis.speak(ttsobj);
}
