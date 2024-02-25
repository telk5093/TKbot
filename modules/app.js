/**
 * app.js Router
 */
const fs = require('fs');
const express = require('express');
const router = express.Router();


var modules = module.parent.exports.modules;

/**
 * Join
 */
router.get('/join', (req, res) => {
    let contents = String(fs.readFileSync(__dirname + '/../public/join.html'));
    // contents = contents.replace(new RegExp('{client_id}', 'gi'), auth.options.clientId);
    // contents = contents.replace(new RegExp('{redirect_uri}', 'gi'), redirect_uri);
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

/*
app.get('/credential', (req, res) => {
    let redirect_uri = 'https://' + config.host_name + ':' + (config.static_port + 1) + '/credential';
    console.log('[credential] Visit: %s', redirect_uri);

    if (!req.query.code) {
        let contents = String(fs.readFileSync(__dirname + '/public/credential.html'));
        contents = contents.replace(new RegExp('{client_id}', 'gi'), auth.options.clientId);
        contents = contents.replace(new RegExp('{redirect_uri}', 'gi'), redirect_uri);
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(contents);
    } else {
        axios({
            url: 'https://id.twitch.tv/oauth2/token',
            method: 'post',
            data: {
                'client_id': auth.options.clientId,
                'client_secret': auth.options.clientSecret,
                'code': req.query.code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri,
            },
            responseType: 'json',
        })
        .then(rst => {
            auth.options.oauth_token = rst.data.access_token;
            auth.options.refresh_token = rst.data.refresh_token;
            console.log('[ACCESS] Now OAuth token is %s and Refresh token is %s, expires in %d seconds later', auth.options.oauth_token, auth.options.refresh_token, rst.data.expires_in);
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end('<a href="' + redirect_uri + '">Done</a>');
        })
    }
});
*/


// 다른 라우트 추가 가능
module.exports = router;
