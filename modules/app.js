/**
 * app.js Router
 */
const fs = require('fs');
const crypto = require('crypto');
const lib = require(__dirname + '/../lib/lib.js');
const express = require('express');
// const session = require('express-session');
// const FileStore = require('session-file-store')(session);
const router = express.Router();

/**
 * Global variables
 */
var modules = module.parent.exports.modules;

/**
 * Index
 */
router.get('/', (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    if (req.session.userid) {
        let contents = String(fs.readFileSync(__dirname + '/../public/index.html'));
        contents = contents.replace(/\{@uid\}/ig, req.session.userid);
        res.end(contents);
    } else {
        let contents = String(fs.readFileSync(__dirname + '/../public/login.html'));
        res.end(contents);
    }
});
router.post('/', (req, res) => {
    let userid = req.body.userid;
    let password = crypto.createHash('sha256').update('tkbot_' + req.body.password + '_bot312!').digest('hex');

    let channelConfig = lib.loadChannelConfig(userid);
    if (!channelConfig) {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end('Invalid userid <a href="/">Back</a>');
    } else {
        if (channelConfig.password == password) {
            req.session.userid = userid;
            req.session.save(function() {
                res.redirect('/');
            });
        } else {
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end('Invalid userid <a href="/">Back</a>');
        }
    }
});

/**
 * Logout
 */
router.get('/logout', (req, res) => {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
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
router.get('/join', (req, res) => {
    let channelUid = req.session.userid;
    let channelConfig = lib.loadChannelConfig(channelUid);
    if (!channelConfig) {
        res.redirect('/logout');
        return;
    }

    let contents = String(fs.readFileSync(__dirname + '/../public/join.html'));
    contents = contents.replace(/\{@chzzkId\}/ig, channelConfig.channels.chzzk);
    contents = contents.replace(/\{@youtubeId\}/ig, channelConfig.channels.youtube);
    contents = contents.replace(/\{@twitchId\}/ig, channelConfig.channels.twitch);
    // contents = contents.replace(/\{@kickId\}/ig, channelConfig.channels.kick);
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contents);
});
router.post('/join', (req, res) => {
    let channelUid = req.session.userid;
    if (!channelUid) {
        res.redirect('/logout');
    }

    let chzzk = req.body.chzzk;
    let youtube = req.body.youtube;
    let twitch = req.body.twitch;
    // let kick = req.body.kick;

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
