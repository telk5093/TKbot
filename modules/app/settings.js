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

    let doc = new Doc();
    doc.setTitle('Settings');
    doc.setView('settings');
    doc.prepareJS('settings.js');
    doc.replace({
        'chzzk': channelConfig.channels?.chzzk ?? '',
        'youtube': channelConfig.channels?.youtube ?? '',
        'twitch': channelConfig.channels?.twitch ?? '',
        // 'kick': channelConfig.channels?.kick ?? '',
        'dccon.baseUrl': channelConfig.chat?.dccon?.baseUrl ?? '',
        'dccon.js': channelConfig.chat?.dccon?.js ?? '',
        'dccon.image': channelConfig.chat?.dccon?.image ?? '',
        'openttd.host': channelConfig.openttd?.host ?? '',
        'openttd.port': channelConfig.openttd?.port ?? '',
        'openttd.password': channelConfig.openttd?.password ?? '',
    });
    doc.print(req, res);
});
router.post('/settings', (req, res) => {
    let output = {};
    let channelUid = req.session.channelUid;

    try {
        if (!channelUid) {
            throw 'Please login';
        }

        // Load channel's config
        let channelConfig = lib.loadChannelConfig(channelUid);

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

        // Save channel's config
        lib.saveChannelConfig(channelUid, channelConfig);

        res.redirect('/settings');

    } catch (e) {
        let doc = new Doc();
        doc.setView('error');
        doc.setContent(e + ' <a href="/">Back</a>');
        doc.print(req, res, 'blank');
    }
    res.end(JSON.stringify(output));
});

module.exports = router;
