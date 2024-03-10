/**
 * requires
 */
const fs = require('fs');
const crypto = require('crypto');
const lib = require(__dirname + '/../../lib/lib.js');
const Doc = require(__dirname + '/../../lib/doc.js');
const express = require('express');
const router = express.Router();

router.get('/settings', (req, res) => {
    // Auth
    let channelUid = req.session.channelUid;
    let channelConfig = lib.loadChannelConfig(channelUid);
    if (!channelConfig) {
        res.redirect('/logout');
        return;
    }

    // Prepare data
    let data = {
        'chzzk': channelConfig.channels?.chzzk,
        'youtube': channelConfig.channels?.youtube,
        'twitch': channelConfig.channels?.twitch,
        // 'kick': channelConfig.channels?.kick,

        'dccon.baseUrl': channelConfig.chat?.dccon?.baseUrl,
        'dccon.js': channelConfig.chat?.dccon?.js,
        'dccon.image': channelConfig.chat?.dccon?.image,

        'openttd.host': channelConfig.openttd?.host,
        'openttd.port': channelConfig.openttd?.port,
        'openttd.password': channelConfig.openttd?.password,

        'tts.enabled': true,   // channelConfig.tts.enabled > 0 ? true : false,
        'tts.banword': channelConfig.tts.banword.join('\n'),
        'tts.banuser': channelConfig.tts.banuser.join('\n'),
    };
    let dataProcessed = {};
    for (let _key in data) {
        dataProcessed[_key] = lib.htmlspecialchars(data[_key]) ?? ''
    }

    let doc = new Doc();
    doc.setTitle('Settings');
    doc.setView('settings');
    doc.prepareJS('settings.js');
    doc.replace(dataProcessed);
    doc.print(req, res);
});
router.post('/settings', (req, res) => {
    let output = {};
    let channelUid = req.session.channelUid;

    try {
        if (!channelUid) {
            throw '로그인해주세요';
        }

        // Load channel's config
        let channelConfig = lib.loadChannelConfig(channelUid);

        // Password
        if (req.body.password != req.body.password2) {
            throw '비밀번호 변경과 비밀번호 변경 확인 란이 일치하지 않습니다';
        }
        if (req.body.password && req.body.password2 && req.body.password == req.body.password2) {
            channelConfig.password = req.body.password;
        }

        // Channel IDs
        if (!channelConfig.channels) {
            channelConfig.channels = {};
        }
        channelConfig.channels.chzzk = req.body.chzzk ?? null;
        channelConfig.channels.youtube = req.body.youtube ?? null;
        channelConfig.channels.twitch = req.body.twitch ?? null;
        // channelConfig.channels.kick = req.body.kick ?? null;

        // Dccon
        if (!channelConfig.chat) {
            channelConfig.chat = {};
        }
        if (!channelConfig.chat.dccon) {
            channelConfig.chat.dccon = {};
        }
        channelConfig.chat.dccon.baseUrl = req.body['dccon.baseUrl'] ?? null;
        channelConfig.chat.dccon.js = req.body['dccon.js'] ?? null;
        channelConfig.chat.dccon.image = req.body['dccon.image'] ?? null;

        // OpenTTD
        if (!channelConfig.openttd) {
            channelConfig.openttd = {};
        }
        channelConfig.openttd.host = req.body['openttd.host'] ?? null;
        channelConfig.openttd.port = req.body['openttd.port'] ?? null;
        channelConfig.openttd.password = req.body['openttd.password'] ?? null;

        // TTS
        if (channelConfig.tts) {
            channelConfig.tts = {};
        }
        channelConfig.tts.enabled = true;
        channelConfig.tts.banword = req.body['tts.banword'].split('\n').filter(x => x).map(x => { return x.trim(); }) ?? [];
        channelConfig.tts.banuser = req.body['tts.banuser'].split('\n').filter(x => x).map(x => { return x.trim(); }) ?? [];

        // Save channel's config
        lib.saveChannelConfig(channelUid, channelConfig);

        res.redirect('/settings');

    } catch (e) {
        let doc = new Doc();
        doc.alert(req, res, e, function() {
            history.go(-1);
        });
        return;
    }
    res.end(JSON.stringify(output));
});

module.exports = router;
