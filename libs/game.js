// The game handler code.
const defaultOptions = {
    rounds: 3,
    roundTime: 30,
    roundName: 'jota',
    started: false,
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
    }

    start () {
        // TODO ADD SHITZZLE HERE.
        this.game.started = true;
    }

    // POINTS...
    hasPoint (team, colour) {
        const roundNr = this.currentRound;
        if (this.game[team][roundNr] === undefined) {
            this.game[team][roundNr] = {};
        }

        if (this.game[team][roundNr][colour] === undefined) {
            this.game[team][roundNr][colour] = 0;
        }
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

    // TIMES




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
