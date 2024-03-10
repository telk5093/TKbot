/**
 * requires
 */
const fs = require('fs');
const crypto = require('crypto');
const lib = require(__dirname + '/../../lib/lib.js');
const Doc = require(__dirname + '/../../lib/doc.js');
const express = require('express');
const router = express.Router();

router.get('/signup', (req, res) => {
    let doc = new Doc();
    doc.setTitle('Sign up');
    doc.setView('signup');
    doc.print(req, res, 'blank');
});
router.post('/signup', (req, res) => {
    let doc = new Doc();
    let channelUid = req.body.channelUid;
    let password = req.body.password;
    let password2 = req.body.password2;

    if (!channelUid.match(/^[a-zA-Z0-9_]+$/ig)) {
        doc.alert(req, res, '아이디는 영문(a-z)과 숫자(0-9), 언더바(_)만 사용할 수 있습니다.', function() {
            history.go(-1);
        });
        return;
    }
    if (password != password2) {
        doc.alert(req, res, '비밀번호와 비밀번호 확인이 일치하지 않습니다.', function() {
            history.go(-1);
        });
        return;
    }

    let dir = fs.readdirSync(__dirname + '/../../config/channels/');
    for (let i in dir) {
        let _fileName = dir[i];
        if (_fileName === '.temp') {
            continue;
        }
        let _channelUid = _fileName.substring(0, _fileName.length - 5);
        if (channelUid == _channelUid) {
            doc.alert(req, res, '사용할 수 없는 아이디입니다.', function() {
                history.go(-1);
            });
            return;
        }
    }

    // Save
    const ip = req.headers['x-forwarded-for'] || req.ip
    let passwordCrypted = crypto.createHash('sha256').update('tkbot_' + password + '_bot312!').digest('hex');
    let new_channelConfig = {
        password: passwordCrypted,
        misc: {
            sign_ip: ip,
        }
    }
    lib.saveChannelConfig(channelUid, new_channelConfig);

    req.session.channelUid = channelUid;
    req.session.save(function() {
        res.redirect('/');
    });
});

module.exports = router;
