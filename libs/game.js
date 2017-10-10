'use strict';

// The game handler code.
const roundTimeStep = 1000;

function minutesToMs (min) {
    return min * 60 * 1000;
}

function msToMinute (ms) {
    return parseInt((ms / (1000 * 60)) % 60);
}

function msToTime (duration) {
    let seconds = parseInt((duration / 1000) % 60);
    let minutes = msToMinute(duration);

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return minutes + ":" + seconds;
}

module.exports = class Game {
    constructor (options) {
        this.defaults = {
            rounds: 3,
            roundTime: 30,
            roundName: 'JOTA-JOTI 2017',
            started: false,
            emitter: null,
            points: {
                red: 1,
                green: 5,
                blue: 9
            },
            team1: {
                name: 'Smokkelaars'
            },
            team2: {
                name: 'Douaniers'
            }
        };
        this.game = Object.assign({}, this.defaults, options);
        this.currentRound = 0;
        this.ended = false;

        // Replaces all the non characters to nothing..
        this.internalId = this.game.roundName.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

        // This is a fixed number.
        this.roundTimeInMs = minutesToMs(this.game.roundTime);
        this.roundTimer = null;
        // This will be substracted untill 0;
        this.roundTimeLeft = minutesToMs(this.game.roundTime);

        // Warn about time left..
        this.roundTimeLeftWarning = minutesToMs(5);

        this.roundTimeStep = roundTimeStep;

        this.currentTimeFactor = 1;
    }

    start () {
        console.log(`Game ${this.game.roundName} is started!`);
        this.game.started = true;
        this.currentRound = 1;

        this.startRound();
    }

    // STATUS
    smallStatus (points) {
        if (!points) {
            points = this.calculatePoints();
        }

        if (!this.started) {
            return `Spel: ${this.name}, is nog niet gestart`;
        }

        return `${this.game.team1.name}: ${points.team1} - ${this.game.team2.name}: ${points.team2}`;
    }

    // POINTS...
    pointsChanged () {
        const points = this.calculatePoints()

        this.game.emitter.emit('points-changed', {
            id: this.id,
            score: points,
            smallStatus: this.smallStatus(points)
        });
    }
    hasPoint (team, colour) {
        const roundNr = this.currentRound;
        if (this.game[team][roundNr] === undefined) {
            this.game[team][roundNr] = {};
        }

        if (this.game[team][roundNr][colour] === undefined) {
            this.game[team][roundNr][colour] = 0;
        }
    }
    calculatePoints (round = this.currentRound) {
        const t1 = this.game.team1[round];
        const t2 = this.game.team2[round];

        const count = (obj) => {
            if (!obj) {
                return 0;
            }

            return (obj.red || 0) + (obj.green || 0) + (obj.blue || 0);
        };

        return {
            team1: count(t1),
            team2: count(t2)
        };
    }

    calculateAllRounds () {
        const obj = {};
        for (let i = 0; i < this.game.rounds; i++) {
            obj[i + 1] = this.calculatePoints(i + 1);
        }
        return obj;
    }

    addPoint (point) {
        const roundNr = this.currentRound;
        const {team, colour} = point;

        this.hasPoint(team, colour);

        this.game[team][roundNr][colour] += this.game.points[colour];
    }
    substractPoint (point) {
        const roundNr = this.currentRound;
        const {team, colour} = point;

        this.hasPoint(team, colour);

        if (this.game[team][roundNr][colour] - this.game.points[colour] <= 0) {
            this.game[team][roundNr][colour] = 0;
        } else {
            this.game[team][roundNr][colour] -= this.game.points[colour];
        }
    }
    validatePointAction (team, colour, action) {
        return ['team1', 'team2'].includes(team) && ['red', 'green', 'blue'].includes(colour) && ['plus', 'min'].includes(action);
    }
    handlePoints (team, colour, action) {
        if (!this.validatePointAction(team, colour, action)) {
            return;
        }

        if (action === 'plus') {
            this.addPoint({team, colour});
        } else {
            this.substractPoint({team, colour});
        }
        this.pointsChanged();
    }

    // TIMES
    startRound () {
        console.log('Start new round:', this.currentRound, '| For game:', this.game.roundName);
        // Resets timeleft..
        this.roundTimeLeft = this.roundTimeInMs;

        this.startTimer();
    }
    startTimer () {
        if (this.roundTimer !== null) {
            clearInterval(this.roundTimer);
        }

        this.roundTimer = setInterval(() => {
            this.roundTimeLeft -= roundTimeStep;

            if (this.roundTimeLeft <= 0) {
                // Stop the timer.
                clearInterval(this.roundTimer);

                // Check if we need to restart.
                if (this.currentRound < this.game.rounds) {
                    this.currentRound++;

                    // Notify every player.
                    this.game.emitter.emit('round-changed', {
                        id: this.id,
                        round: this.currentRound
                    });
                    this.startRound();
                } else {
                    console.log(`Game ${this.game.roundName} has been ended!`);
                    this.ended = true;
                    this.game.started = false;

                    // TODO: Write results to file.

                    this.game.emitter.emit('game-ended', {
                        id: this.id,
                        name: this.name,
                        ended: this.ended
                    });
                }
            } else {
                if (this.roundTimeLeft === this.roundTimeLeftWarning) {
                    this.game.emitter.emit('time-warning', {
                        id: this.id,
                        name: this.name,
                        round: this.currentRound,
                        minutes: this.minutesLeft
                    });
                }
            }
        }, this.roundTimeStep);
    }
    timeFactor (factor = 1) {
        // Bases on the original 1000 ms
        this.roundTimeStep = Math.round(roundTimeStep / factor);

        this.currentTimeFactor = factor;

        this.startTimer();

        this.emitter.emit('time-factor-change', {
            id: this.id,
            timeFactor: factor
        })
    }

    // GETTERS!
    get teamNames () {
        return {
            team1: this.game.team1.name,
            team2: this.game.team2.name,
        }
    }
    get emitter () {
        return this.game.emitter;
    }
    get name () {
        return this.game.roundName;
    }
    get id () {
        return this.internalId;
    }
    get started () {
        return this.game.started;
    }
    get statistics () {
        return {
            id: this.id,
            name: this.name,
            started: this.started,
            rounds: this.game.rounds,
            ended: this.ended,
            round: this.currentRound,
            teams: this.teamNames,
            score: this.calculateAllRounds(),
            totalTime: this.roundTimeInMs,
            currentTime: this.timeLeft,
            timeFactor: this.currentTimeFactor
        };
    }
    get timeLeft () {
        return this.roundTimeLeft;
    }
    get timeLeftReadable () {
        return msToTime(this.roundTimeLeft);
    }
    get minutesLeft () {
        return msToMinute(this.roundTimeLeft);
    }
};
