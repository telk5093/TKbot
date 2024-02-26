var exports = module.exports = {};

/**
 * requires
 */
const fs = require('fs');

/**
 * 문자열 관련 함수
 */
// match로 시작하는지 확인 (확인은 대소문자 구분 안 함)
exports.startWith = (text, match, case_sensative) => {
    text = String(text);
    if (typeof match === 'string') {
        match = [match];
    }
    for (let i in match) {
        let str = match[i];
        if ((!case_sensative && text.substr(0, str.length).toLowerCase() === str.toLowerCase()) || (case_sensative && text.substr(0, str.length) === str)) {
            return String(text).substr(str.length);
        }
    }
    return false;
}

// match로 시작하는지 확인 후 명령어 기준으로 분리 (확인은 대소문자 구분 안 함)
exports.startWithCmd = (text, match, case_sensative) => {
    text = String(text);
    if (typeof match === 'string') match = [match];
    for (i in match) {
        let str = String(match[i]);
        if ((!case_sensative && text.substr(0, str.length).toLowerCase() === str.toLowerCase()) || (case_sensative && text.substr(0, str.length) === str)) {
            if (String(text).substring(str.length, str.length + 1) === ' ') {
                param = String(text).substr(str.length);
            } else {
                param = null;
            }
            return {
                'command': str,
                'param': param
            }
        }
    }
    return false;
}

// 문자열 비교
exports.isMatch = (text, match, case_sensative) => {
    text = String(text);
    if (typeof match === 'string') match = [match];
    if (match instanceof RegExp) {
        return !(text.match(match) === null);
    } else {
        for (i in match) {
            if ((case_sensative && text === String(match[i])) || (!case_sensative && text.toLowerCase() === String(match[i]).toLowerCase())) {
                return true;
            }
        }
    }
    return false;
}

// 문자열 안에 있는지 확인
exports.isIn = (text, match, case_sensative) => {
    text = String(text);
    if (typeof match === 'string') match = [match];
    for (i in match) {
        let _match = String(match[i]);
        if (case_sensative) {
            if (text.indexOf(_match) >= 0) return _match;
        } else {
            if ((text.toLowerCase()).indexOf(_match.toLowerCase()) >= 0) return _match;
        }
    }
    return false;
}

// More accurate random()
exports.random = random = () => {
    return window.crypto.getRandomValues(new Uint32Array(1)) / 4294967296;
}

// 종성 확인
exports.isMale = (txt) => {
    if (typeof txt !== 'string') {
        return false;
    }

    // 종성 여부 확인
    let ccode = txt.charCodeAt(txt.length - 1) - 44032;
    let cho = 19, jung = 21, jong = 28;
    if (ccode >= 0 && ccode <= 11171) {
        if (ccode % 28 === 0) {
            return false;
        } else {
            return true;
        }
    }
}

// time_limit 이내에 채팅을 친 사람 목록 가져오기
exports.getChattersNumber = (time_limit) => {
    let chatters = module.parent.exports.chatters;
    let recent_chatters = [];
    let _time = time();
    for (user_id in chatters) {
        if (_time - chatters[user_id].time < time_limit) recent_chatters.push(user_id);
    }

    return recent_chatters;
}

// YouTube 시간을 seconds로 변환
exports.YTDurationToSeconds = (duration) => {
    var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    match = match.slice(1).map((x) => {
        if (x != null) {
            return x.replace(/\D/, '');
        }
    });
    let hours = (parseInt(match[0]) || 0);
    let minutes = (parseInt(match[1]) || 0);
    let seconds = (parseInt(match[2]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Read from JSON
 * @param string filePath
 * @return Object
 */
exports.readJSON = (filePath) => {
    try {
        let contents = null;
        if (fs.existsSync(filePath)) {
            contents = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(contents);
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

/**
 * Save JSON to file
 */
exports.saveJSON = (filePath, jsonData) => {
    try {
        return fs.writeFileSync(filePath, JSON.stringify(jsonData, null, '\t'));
    } catch (e) {
        console.error(e);
        return false;
    }

};

/**
 * 시간 관련 함수
 */
// 현재 시각
var time = exports.time = () => {
    return Math.floor((new Date()).getTime() / 1000);
}

// 시간 표시
exports.time2readable = (second) => {
    let dst = '';
    second = Number(second);
    if (second >= 3600) {
        dst += Math.floor(second / 3600) + '시간 ';
        second %= 3600;
    }
    if (second >= 60) {
        dst += Math.floor(second / 60) + '분 ';
        second %= 60;
    }
    if (second > 0) {
        dst += (second % 60) + '초';
    }
    return String(dst).trim();
}

// 남은 시간 표시
exports.toHMS = (second) => {
    let dst = '';
    if (second >= 3600) {
        dst += String(Math.floor(second / 3600)) + '시간 ';
        second %= 3600;
    }
    if (second >= 60) {
        dst += String(Math.floor(second / 60)) + '분 ';
        second %= 60;
    }
    if (second > 0) {
        dst += String(second % 60) + '초 ';
    }
    return dst.substr(0, dst.length - 1);
}

// Date 객체 처리
exports.prettyDate = (dt) => {
    if (!dt) {
        dt = new Date();
    }

    let y = dt.getFullYear() % 100 + 2000;
    let m = dt.getMonth() + 1;
    let d = dt.getDate();
    let h = dt.getHours();
    let i = dt.getMinutes();
    let s = dt.getSeconds();
    let mm = String(m).padStart(2, '0');
    let dd = String(d).padStart(2, '0');
    let hh = String(h).padStart(2, '0');
    let ii = String(i).padStart(2, '0');
    let ss = String(s).padStart(2, '0');

    return {
        'y': y,
        'm': m,
        'd': d,
        'h': h,
        'i': i,
        's': s,
        'mm': mm,
        'dd': dd,
        'hh': hh,
        'ii': ii,
        'ss': ss,
        'date': y + '.' + mm + '.' + dd,
        'time': hh + ':' + ii + ':' + ss,
        'full_str': y + '.' + mm + '.' + dd + ' ' + hh + ':' + ii + ':' + ss
    }
}

/**
 * 에러 처리
 */
exports.error = error = (errstr, errno) => {
    let msg = '(' + errstr + ') ' + errstr + '\n';
    fs.writeFile(require.main.filename + '/errors.log', msg, (err) => {
        if (err) {
            console.log('오류 파일 쓰기 오류!');
        };
    });
}
