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

// Index
router.use('/', require(__dirname + '/app/index'));

// Signup
router.use('/', require(__dirname + '/app/signup'));

// Settings
router.use('/', require(__dirname + '/app/settings'));


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
router.get('/chat-test', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/chat-test.html'));
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
