/**
 * requires
 */
const fs = require('fs');
const lib = require(__dirname + '/lib.js');
const express = require('express');

let Doc = exports.Doc = class {
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

    // Alert
    alert(req, res, message, action = '') {
        let scriptHTML = null;
        scriptHTML += '<script>\n';
        scriptHTML += 'alert("' + message.replace(/'/ig, '\\\'') + '");\n'

        if (typeof action === 'function') {
            scriptHTML += '(' + action + ')();\n';
        } else if (typeof action === 'string') {
            scriptHTML += action + '\n';
        }
        scriptHTML += '</script>';
        this.setContent(scriptHTML);
        this.print(req, res, 'blank');
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
        template = template.replace(/\{@title\}/ig, lib.htmlspecialchars(this.title ?? 'TKbot'));

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
        } else {
            if (this.content) {
                content = this.content;
            }
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

module.exports = Doc;
