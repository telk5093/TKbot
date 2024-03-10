/**
 * requires
 */
const crypto = require('crypto');
const lib = require(__dirname + '/../../lib/lib.js');
const Doc = require(__dirname + '/../../lib/doc.js');
const express = require('express');
const router = express.Router();

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

module.exports = router;
