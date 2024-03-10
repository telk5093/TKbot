/**
 * app.js Router
 */
const fs = require('fs');
const crypto = require('crypto');
const lib = require(__dirname + '/../lib/lib.js');
const Doc = require(__dirname + '/../lib/doc.js');
const express = require('express');
const router = express.Router();

/**
 * Global variables
 */
var modules = module.parent.exports.modules;

/**
 * Test
 */
router.get('/test', (req, res) => {
    let doc = new Doc();
    doc.setTitle('Test');
    doc.prepareCSS('test.css');
    doc.prepareJS('test.js');
    doc.setView('test');
    doc.print(req, res, 'blank');
});

/**
 * Index
 */
router.get('/', (req, res) => {
    if (req.session.channelUid) {
        let doc = new Doc();
        doc.setTitle(null);
        doc.setView('index');
        doc.print(req, res);
    } else {
        let doc = new Doc();
        doc.setTitle(null);
        doc.setView('login');
        doc.print(req, res, 'blank');
    }
});
router.post('/', (req, res) => {
    let channelUid = String(req.body.channelUid).trim();
    let password = crypto.createHash('sha256').update('tkbot_' + req.body.password + '_bot312!').digest('hex');

    let channelConfig = lib.loadChannelConfig(channelUid);
    if (!channelConfig) {
        let doc = new Doc();
        doc.setView('error');
        doc.setContent('[E01] Invalid userid <a href="/">Back</a>');
        doc.print(req, res, 'blank');
    } else {
        if (channelConfig.password == password) {
            if (req.body.save_channelUid > 0) {
                res.cookie('channelUid', channelUid, {maxAge: 86400 * 30 * 1000, httpOnly: true})
            }
            req.session.channelUid = channelUid;
            req.session.save(function() {
                res.redirect('/');
            });
        } else {
            let doc = new Doc();
            doc.setView('error');
            doc.setContent('[E02] Invalid userid <a href="/">Back</a>');
            doc.print(req, res, 'blank');
        }
    }
});

/**
 * Logout
 */
router.get('/logout', (req, res) => {
    req.session.channelUid = null;
    req.session.save(function() {
        res.redirect('/');
    });
    // req.session.destroy(function (err) {
    //     res.redirect('/');
    // });
});

/**
 * Config
 */
router.get('/config/chat/:uid\.json', (req, res) => {
    let uid = req.params.uid;
    let contents = '';
    if (fs.existsSync(__dirname + '/../config/channels/' + uid + '.json')) {
        let _channelConfig = lib.readJSON(__dirname + '/../config/channels/' + uid + '.json');
        contents = JSON.stringify(_channelConfig.chat);
    } else {
        contents = 'Invalid username';
    }
    res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
    res.end(contents);
});
router.get('/config/tts/:uid\.json', (req, res) => {
    let uid = req.params.uid;
    let contents = '';
    if (fs.existsSync(__dirname + '/../config/channels/' + uid + '.json')) {
        let _channelConfig = lib.readJSON(__dirname + '/../config/channels/' + uid + '.json');
        contents = JSON.stringify(_channelConfig.tts);
    } else {
        contents = 'Invalid username';
    }
    res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
    res.end(contents);
});


/**
 * Settings
 */
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

/**
 * Join
 */
router.post('/join', (req, res) => {
    let output = {};
    let channelUid = req.session.channelUid;

    try {
        if (!channelUid) {
            throw 'Please login';
        }

        let platform = req.body.platform;
        let channelId = req.body.channelId;

        switch (platform) {
            case 'chzzk':
                modules['core/chzzk'].join(channelUid, channelId);
                break;
            case 'youtube':
                modules['core/youtube'].join(channelUid, channelId);
                break;
            case 'twitch':
                modules['core/twitch'].join(channelUid, channelId);
                break;
            // case 'kick':
            //     modules['core/kick'].join(channelUid, channelId);
            //     break;
        }

        res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
        output = {
            'state': 'success',
            'message': 'Success to join'
        };

    } catch (e) {
        res.writeHead(403, {'Content-Type': 'text/json; charset=utf-8'});
        output = {
            'state': 'error',
            'message': e,
        };
    }
    res.end(JSON.stringify(output));
});

/**
 * Quit
 */
router.post('/quit', (req, res) => {
    let output = {};
    let channelUid = req.session.channelUid;

    try {
        if (!channelUid) {
            throw 'Please login';
        }

        let platform = req.body.platform;

        switch (platform) {
            case 'chzzk':
                modules['core/chzzk'].quit(channelUid);
                break;
            case 'youtube':
                modules['core/youtube'].quit(channelUid);
                break;
            case 'twitch':
                modules['core/twitch'].quit(channelUid);
                break;
            // case 'kick':
            //     modules['core/kick'].quit(channelUid);
            //     break;
        }

        res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
        output = {
            'state': 'success',
            'message': 'Success to quit'
        };

    } catch (e) {
        res.writeHead(403, {'Content-Type': 'text/json; charset=utf-8'});
        output = {
            'state': 'error',
            'message': e,
        };
    }
    res.end(JSON.stringify(output));
});


/**
 * Chat
 */
router.get('/chat', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/chat.html'));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contents);
});


/**
 * TTS
 */
router.get('/tts', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/tts.html'));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contents);
});

module.exports = router;
