/**
 * app.js Router
 */
const fs = require('fs');
const express = require('express');
const router = express.Router();

/**
 * Global variables
 */
var modules = module.parent.exports.modules;

/**
 * Join
 */
router.get('/join', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/join.html'));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(contents);
});
router.post('/join', (req, res) => {
    let chzzk = req.body.chzzk;
    let youtube = req.body.youtube;
    let twitch = req.body.twitch;
    let kick = req.body.kick;

    modules['core/chzzk'].join(chzzk);
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
