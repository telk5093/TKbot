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

let Doc = class {
    #cssList = [];
    #jsList = [];
    #title = 'TKbot';
    #viewFileName = null;
    #content = null;
    #replaceData = {};

    constructor() {
        this.cssList = [];
        this.jsList = [];
    }

    prepareCSS(path) {
        if (this.cssList.indexOf(path) < 0) {
            this.cssList.push(path);
        }
    }
    prepareJS(path) {
        if (this.jsList.indexOf(path) < 0) {
            this.jsList.push(path);
        }
    }

    // Set Title
    setTitle(title) {
        if (title) {
            this.title = 'TKbot - ' + title;
        } else {
            this.title = 'TKbot';
        }
    }

    // Set view page
    setView(viewFileName) {
        this.viewFileName = viewFileName;
    }

    // Set content itself
    setContent(content) {
        this.content = content;
    }

    // Replace
    replace(replaceData) {
        this.replaceData = replaceData;
    }

    // Print
    print(req, res, templateName = 'default') {
        // Load template
        let template = null;
        let templatePath = __dirname + '/../public/template/' + templateName + '.html';
        if (!fs.existsSync(templatePath)) {
            templatePath = __dirname + '/../public/template/blank.html';
        }
        template = String(fs.readFileSync(templatePath));

        // Title
        template = template.replace(/\{@title\}/ig, lib.htmlspecialchars(this.title));

        // Add css tags
        let cssTags = [];
        for (let i in this.cssList) {
            cssTags.push('<link rel="stylesheet" type="text/css" href="/css/' + this.cssList[i] + '" />');
        }
        template = template.replace(/\{@cssList\}/ig, cssTags.join("\n\t"));

        // Add javascript tags
        let jsTags = [];
        for (let i in this.jsList) {
            jsTags.push('<script src="/js/' + this.jsList[i] + '"></script>');
        }
        template = template.replace(/\{@jsList\}/ig, jsTags.join("\n\t"));

        let params = {};
        let content = '';
        if (fs.existsSync(__dirname + '/../public/' + this.viewFileName + '.html')) {
            content = String(fs.readFileSync(__dirname + '/../public/' + this.viewFileName + '.html'));

            if (this.content) {
                content = content.replace(/\{@content\}/ig, this.content);
            }

            // Sessions
            for (let _key in req.session) {
                let _val = req.session[_key];
                params[_key] = _val;
            }
            
            // Cookies
            for (let _key in req.cookies) {
                let _val = req.cookies[_key];
                params[_key] = _val;
            }

            // POST
            for (let _key in req.body) {
                let _val = req.body[_key];
                params[_key] = _val;
            }

            // GET
            for (let _key in req.query) {
                let _val = req.query[_key];
                params[_key] = _val;
            }

            // REQUEST
        }
        template = template.replace(/\{@content\}/ig, content);
        template = template.replace(/\{@session:(.+?)\}/ig, function(m, _k) {
            if (_k in req.session) {
                return req.session[_k];
            } else {
                return '';
            }
        });

        let tempParams = {
            'cookie': req.cookies,   // COOKIE
            'post': req.body,      // POST
            'get': req.query,     // GET
            'request': params,        // REQUEST
        }
        for (let _method in tempParams) {
            template = template.replace(new RegExp('\{@' + _method + ':(.+?)\}', 'ig'), function(m, _k) {
                if (_k in tempParams[_method]) {
                    return tempParams[_method][_k];
                } else {
                    return '';
                }
            });
        }

        // Replace data
        for (let _key in this.replaceData) {
            template = template.replace(new RegExp('\{@data:' + _key + '}', 'ig'), this.replaceData[_key]);
        }

        // Print
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(template);
    }
}

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
    doc.replace({
        'chzzkId': channelConfig.channels.chzzk,
        'youtubeId': channelConfig.channels.youtube,
        'twitchId': channelConfig.channels.twitch,
        // 'kickId': channelConfig.channels.kick,
    });
    doc.print(req, res);
});
router.post('/join', (req, res) => {
    let channelUid = req.session.channelUid;
    if (!channelUid) {
        res.redirect('/logout');
    }

    let chzzkId = req.body.chzzkId;
    let youtubeId = req.body.youtubeId;
    let twitchId = req.body.twitchId;
    // let kickId = req.body.kickId;

    if (chzzkId) {
        modules['core/chzzk'].join(channelUid, chzzkId);
    } else {
        modules['core/chzzk'].quit(channelUid);
    }
    if (youtubeId) {
        modules['core/youtube'].join(channelUid, youtubeId);
    } else {
        modules['core/youtube'].quit(channelUid);
    }
    if (twitchId) {
        modules['core/twitch'].join(channelUid, twitchId);
    } else {
        modules['core/twitch'].quit(channelUid);
    }
    // if (kickId) {
    //     modules['core/kick'].join(channelUid, kickId);
    // }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end('Done <a href="/">Back</a>');
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
