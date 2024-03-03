/**
 * app.js Router
 */
const fs = require('fs');
const lib = require(__dirname + '/../lib/lib.js');
const express = require('express');
const router = express.Router();

/**
 * Global variables
 */
var modules = module.parent.exports.modules;

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
router.get('/join', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/join.html'));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contents);
});
router.post('/join', (req, res) => {
    let channelUid = req.body.channelUid;
    let chzzk = req.body.chzzk;
    let youtube = req.body.youtube;
    let twitch = req.body.twitch;
    let kick = req.body.kick;

    if (chzzk) {
        modules['core/chzzk'].join(channelUid, chzzk);
    }
    if (youtube) {
        modules['core/youtube'].join(channelUid, youtube);
    }
    if (twitch) {
        modules['core/twitch'].join(channelUid, twitch);
    }
    res.end('Done');
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

// 다른 라우트 추가 가능
module.exports = router;
