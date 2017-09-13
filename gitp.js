/**
 * General server code.
 */
const http = require('http');
const eventEmit = require('events');

const emitter = new eventEmit();

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
    function growl (type, message) {
        socket.emit('growl', {
            type,
            message
        });
    }
    function checkPassword (obj) {
        if (obj.password === undefined) {
            return false;
        }
        return pass.compare(obj.password);
    }
    function isFalseData (obj) {
        if (!obj instanceof Object || !checkPassword(obj)) {
            growl('error', 'Ongeldig wachtwoord, jammer de bammer.');
            return true;
        }
        return false;
    }

    // Send queued and active games.
    function sendGames () {
        for (const prop in games) {
            const spel = games[prop];
            if (!spel) {
                continue;
            }

            socket.emit('game:existing', {
                id: spel.id,
                name: spel.name,
                active: spel.started
            });
        }
    }

    // On initial load
    sendGames();


    socket.on('game:create', (data) => {
        if (isFalseData(data)) {
            return;
        }

        data.emitter = emitter;

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
            name: newgame.name,
            active: newgame.started
        });
    });

    socket.on('game:focus', (data) => {
        if (isFalseData(data)) {
            return;
        }

        if (games[data.id] === undefined || socket.focussedGame === data.id) {
            return;
        }

        socket.focussedGame = data.id;

        games[data.id].emitter.on('points-changed', (data) => {
            if (socket.focussedGame !== data.id) {
                // False listener, stop here.
                return;
            }
            console.log(data);
        });
    });

    socket.on('game:points', (data) => {
        if (isFalseData(data)) {
            return;
        }

        const gameId = socket.focussedGame;
        const selectedGame = games[gameId]

        if (selectedGame === undefined || !selectedGame.started) {
            growl('error', 'Geselecteerd spel niet gevonden of gestart.');
            return;
        }

        selectedGame.handlePoints(...data.action.split(':'));
    });

    socket.on('game:start', (data) => {
        if (isFalseData(data)) {
            return;
        }

        const id = data.id;
        if (games[id] !== undefined) {
            games[id].start();

            sendGames();
        } else {
            growl('warning', 'Onbekent spel, kan dus niet starten.');
        }
    });
});
