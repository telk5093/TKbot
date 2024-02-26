#!/usr/bin/env node

/**--------------------------------------------------------------------------------------------------
 * Tbot
 *--------------------------------------------------------------------------------------------------*/
/**
 * requires
 */
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');


/**
 * Initialize global variables
 */
var modules = exports.modules = {};
var chatters = exports.chatters = {};


/**
 * Authenticates & Configurations
 */
const auth = require(__dirname + '/config/auth.js');
const config = require(__dirname + '/config/config.js');


/**
 * Static file service
 */
const app = exports.app = express();
const appRouter = require(__dirname + '/modules/app');   // Use router from /modules/app.js
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));
app.use('/', appRouter);
app.use(express.static('public'));

// http
var http = exports.http = require('http').createServer(app);
http.listen(config.static_port, () => {
    console.log('[INFO] Static file service and socket server(http) has been started at ' + config.static_port + ' port');
});

// https
if (config.use_https) {
    const credentials = {
        key: fs.readFileSync(__dirname + config.http_credentials.key),
        cert: fs.readFileSync(__dirname + config.http_credentials.cert),
    };
    var https = exports.https = require('https').createServer(credentials, app);
    https.listen(config.static_port + 1, () => {
        console.log('[INFO] Static file service and socket server(https) has been started at ' + (config.static_port + 1) + ' port');
    });
}


/**
 * Initialize bot
 */
var init = async () => {
    try {
        // Loaded modules
        let modulesIncluded = {};

        // Load core modules
        let _coreModules = fs.readdirSync(__dirname + '/modules/core/');
        for (let i = 0; i < _coreModules.length; i++) {
            let _moduleName = 'core/' + String(_coreModules[i]).substring(0, _coreModules[i].length - 3);
            if (!modulesIncluded[_moduleName] && String(_coreModules[i]).substring(0, 1) !== '#' && String(_coreModules[i]).substring(_coreModules[i].length - 3, _coreModules[i].length) === '.js') {
                modules[_moduleName] = require(__dirname + '/modules/core/' + _coreModules[i]);
                console.log('[core module] Successfully loaded: %s', _coreModules[i]);
                if (typeof modules[_moduleName].init === 'function') {
                    modules[_moduleName].init();
                    modulesIncluded[_moduleName] = true;
                }
            }
        }

        // Socket
        var io = exports.io = socketio(config.use_https ? https : http);
        var chatio = exports.chatio = io.of('/chat');
        // io.on('connection', (_socket) => {
        //     let ip = _socket.handshake.address;
        //     if (ip.indexOf(':') >= 0 && ip !== '::1') {
        //         let tmpip = ip.split(':');
        //         ip = tmpip[tmpip.length - 1];
        //     }

        //     // Call each module's socket() method if exists
        //     for (let _moduleName in modules) {
        //         if (typeof modules[_moduleName].socket === 'function') {
        //             modules[_moduleName].socket(_socket);
        //         }
        //     }
        // });
        chatio.on('connection', (_socket) => {
            if (typeof modules['core/chat'].socket === 'function') {
                modules['core/chat'].socket(_socket);
            }
        });

    // Error
    } catch (e) {
        console.log('[ERROR] %s', e.message);
        console.log(e.stack);
    }
};
init();
