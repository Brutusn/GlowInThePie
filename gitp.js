/**
 * General server code.
 */
const http = require('http');

const express = require('express');
const socketio = require('socket.io');

const Game = require('./libs/game');
// Store active games (session based);
let games = {};

const pass = require('./libs/password');

// Ultimate basic http server with socket.io... ////////////////////////////////
const app = express();
const server = http.Server(app);
const io = socketio(server);

app.use(express.static('www'));
server.listen(8080);

////////////////////////////////////////////////////////////////////////////////
// Socket.io events.
io.on('connection', (socket) => {
    function checkPassword (obj) {
        if (obj.password === undefined) {
            return false;
        }
        return pass.compare(obj.password);
    }

    // Send queued and active games.
    function sendGames () {
        for (const prop in games) {
            const spel = games[prop];
            if (!spel) {
                continue;
            }

            let emit = '';
            if (spel.started) {
                emit = 'game:existing:active';
            } else {
                emit = 'game:existing:queue';
            }

            socket.emit(emit, {
                id: spel.id,
                name: spel.name
            });
        }
    }

    // On initial load
    sendGames();


    socket.on('game:create', (data) => {
        if (!data instanceof Object || !checkPassword(data)) {
            socket.emit('growl', {
                type: 'error',
                message: 'Ongeldig wachtwoord, jammer de bammer.'
            });
            return;
        }
        let newgame = new Game(data);

        // Check if game exists and is started, if that is the case, return that
        // game, otherwise send the new instance.
        if (games[newgame.id] !== undefined && games[newgame.id].started) {
            newgame = games[newgame.id];
        } else {
            games[newgame.id] = newgame;
        }

        socket.emit('game:initialized', {
            id: newgame.id,
            name: newgame.name
        });
    });

    socket.on('game:start', (data) => {
        if (!data instanceof Object || !checkPassword(data)) {
            socket.emit('growl', {
                type: 'error',
                message: 'Ongeldig wachtwoord, jammer de bammer.'
            });
            return;
        }

        const id = data.id;
        if (games[id] !== undefined) {
            games[id].start();

            sendGames();
        } else {
            socket.emit('growl', {
                type: 'warning',
                message: 'Onbekent spel, kan dus niet starten.'
            });
        }
    });
});
