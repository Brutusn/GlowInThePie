/**
 * General server code.
 */
'use strict';

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

// This is done to get the chart script directly from the node_modules without
// exposing the entire folder by accident.
app.use('/scripts', express.static(__dirname + '/node_modules/chart.js/dist/'));

server.listen(8080);

////////////////////////////////////////////////////////////////////////////////
// Game events.
emitter.on('points-changed', (data) => {
    io.to(data.id).emit('game:ongoing:statistics', games[data.id].statistics);
    io.to(data.id).emit('game:status:small', data.smallStatus);
});
emitter.on('round-changed', (data) => {
    io.to(data.id).emit('game:ongoing:statistics', games[data.id].statistics);
    io.to(data.id).emit('game:reset:timer', {});
    io.to(data.id).emit('growl', {
        type: 'info',
        message: 'Ronde is over! Nu in ronde: ' + data.round
    });
});
emitter.on('game-ended', (data) => {
    io.to(data.id).emit('game:ongoing:statistics', games[data.id].statistics);

    io.to(data.id).emit('growl', {
        type: 'success',
        message: `Spel: ${data.name} is afgelopen!`
    });
});
emitter.on('time-warning', (data) => {
    io.to(data.id).emit('growl', {
        type: 'warning',
        message: `Ronde ${data.round} duurt nog ${data.minutes} minuten`
    });
});

////////////////////////////////////////////////////////////////////////////////
// Socket.io events.
io.on('connection', (socket) => {
    socket.allowedSocket = false;

    function growl (type, message, broadcast) {
        let messenger = null;

        if (broadcast) {
            messenger = io.to(socket.focussedGame);
        } else {
            messenger = socket;
        }
        messenger.emit('growl', {
            type,
            message
        });
    }

    function checkPassword (obj) {
        if (obj.password === undefined) {
            return false;
        }
        if (pass.compare(obj.password)) {
            socket.allowedSocket = true;
            return true;
        }

        return false;
    }

    function isFalseData (obj) {
        if (!socket.allowedSocket && !checkPassword(obj)) {
            growl('error', 'Ongeldig wachtwoord, jammer de bammer.');
            return true;
        }
        if (!obj instanceof Object) {
            growl('error', 'Geen geldig object gestuurd.');
            return true;
        }
        return false;
    }

    function gameFocus (obj) {
        if (socket.focussedGame !== null) {
            socket.leave(socket.focussedGame);
        }
        socket.focussedGame = obj.id;
        socket.join(obj.id);
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

        // Add the event emitter.
        data.emitter = emitter;

        let newgame = new Game(data);

        // Check if game exists and is started, if that is the case, return that
        // game, otherwise send the new instance.
        if (games[newgame.id] !== undefined && games[newgame.id].started) {
            newgame = games[newgame.id];
        } else {
            games[newgame.id] = newgame;
        }

        io.of('').emit('game:initialized', {
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

        gameFocus(data);

        // Focussed a game, so send small status.
        socket.emit('game:status:small', games[data.id].smallStatus());
        socket.emit('game:initial:statistics', games[data.id].statistics);

        if (games[data.id].started) {
            socket.emit('game:started');
        }
    });

    socket.on('game:points', (data) => {
        if (isFalseData(data)) {
            return;
        }

        const gameId = socket.focussedGame;
        const selectedGame = games[gameId]

        if (selectedGame === undefined || !selectedGame.started) {
            growl('error', 'Geselecteerd spel niet gestart.');
            return;
        }

        selectedGame.handlePoints(...data.action.split(':'));
    });

    socket.on('game:request:team:names', (data) => {
        if (isFalseData(data)) {
            return;
        }

        if (games[data.id] === undefined) {
            growl('error', 'Spel niet gevonden.');
            return;
        }

        socket.emit('game:team:names', games[data.id].teamNames);
    });

    socket.on('game:start', (data) => {
        if (isFalseData(data)) {
            return;
        }

        const id = data.id;
        if (games[id] !== undefined) {
            gameFocus(data);

            games[id].start();

            sendGames();

            io.to(data.id).emit('game:status:small', games[id].smallStatus());
            io.to(data.id).emit('game:initial:statistics', games[id].statistics);

            growl('info', `Spel: ${games[id].name} is gestart!`, true);
        } else {
            growl('warning', 'Onbekent spel, kan dus niet starten.');
        }
    });
});
