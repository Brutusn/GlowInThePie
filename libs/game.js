// The game handler code.
const defaultOptions = {
    rounds: 3,
    roundTime: 30,
    roundName: 'jota',
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
}

function minutesToMs (min) {
    return min * 60 * 1000;
}

module.exports = class Game {
    constructor (options) {
        this.game = Object.assign({}, defaultOptions, options);
        this.currentRound = 0;
        this.previousRounds = [];
    }

    start () {
        // TODO ADD SHITZZLE HERE.
        this.game.started = true;
        this.currentRound = 1;
    }

    // POINTS...
    validatePointAction (team, colour, action) {
        return ['team1', 'team2'].includes(team) && ['red', 'green', 'blue'].includes(colour) && ['plus', 'min'].includes(action);
    }
    pointsChanged () {
        this.game.emitter.emit('points-changed', {
            id: this.id,
            score: this.calculatePoints()
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



    get emitter () {
        return this.game.emitter;
    }
    get name () {
        return this.game.roundName;
    }
    get id () {
        return this.name.toLowerCase();
    }
    get started () {
        return this.game.started;
    }
}
