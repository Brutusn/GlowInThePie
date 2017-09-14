'use strict';

// First things first! Set a password, if not available, to the local storage.
function getLocalPass () {
    return window.localStorage.getItem('app-pass');
}
function appendPassword (obj) {
    obj.password = getLocalPass();
}

if (!getLocalPass()) {
    const password = window.prompt("Geef het wachtwoord op!");

    if (password !== null) {
        window.localStorage.setItem('app-pass', password);
    }
}

////////////////////////////////////////////////////////////////////////////////
/// GLOBAL BITS ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function getPercentage (sub, total) {
    return Math.round((sub / total) * 100);
}

const socket = io(location.host);

socket.on('growl', (data) => {
    console.info(data);
    modal.message(data);
});

socket.on('disconnect', () => {
    modal.message({
        type: 'error',
        message: 'Verbinding met de server verbroken!'
    });
});

socket.on('game:status:small', (data) => {
    const elements = Array.from(document.getElementsByClassName('small-status'));

    for (const element of elements) {
        element.textContent = data;
    }
});

// Force full screen height of dashboard.
const header = document.querySelector('header');
const dashboard = document.getElementById('dashboard');

function setDashboardHeight () {
    // - 2px for the border.
    dashboard.style.height = window.innerHeight - Math.floor(header.clientHeight) - 2 + 'px';
}
setDashboardHeight();

window.addEventListener('resize', setDashboardHeight);

////////////////////////////////////////////////////////////////////////////////
/// NAVIGATION BITS ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
const pages = Array.from(document.querySelectorAll('article'));
const navElement = document.querySelector('nav');

navElement.onclick = (evt) => {
    if (evt.target.nodeName === 'LI') {
        for (const page of pages) {
            page.classList.add('hidden');
        }
        document.getElementById(evt.target.getAttribute('data-action')).classList.remove('hidden');

        navElement.classList.toggle('hidden');
    }
}

document.getElementById('toggle-navigatie').onclick = (evt) => {
    // First it will check if a page is visible, otherwise you can't hide the
    // navigation, because that would be pointless.
    const visiblePages = pages.filter((page) => !page.classList.contains('hidden')).length > 0;

    if (visiblePages) {
        navElement.classList.toggle('hidden');
    }
};

////////////////////////////////////////////////////////////////////////////////
/// ADMIN BITS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

document.getElementById('games-queue').onclick = (evt) => {
    if (evt.target.nodeName !== 'BUTTON') {
        return;
    }

    let obj = {
        id: evt.target.getAttribute('data-start')
    };

    appendPassword(obj);

    socket.emit('game:start', obj);
    socket.emit('game:focus', obj);

    // Remove the clicked LI item.
    evt.target.parentNode.parentNode.removeChild(evt.target.parentNode);
};

function fillGames (data, ulId, addButton = true) {
    const ul = document.getElementById(ulId);

    if (ul.querySelector(`[data-game-id="${data.id}"]`) === null) {
        const li = document.createElement('li');

        li.textContent = data.name;
        li.setAttribute('data-game-id', data.id);

        if (addButton) {
            const button = document.createElement('button');
            button.classList.add('btn-list');
            button.textContent = 'Start';
            button.setAttribute('data-start', data.id);
            li.appendChild(button);
        }

        ul.appendChild(li);
    }
}
function fillPicker (data, ulId, active) {
    const ul = document.getElementById(ulId);
    let li = ul.querySelector(`[data-game-id="${data.id}"]`);
    let append = false;

    if (li === null) {
        li = document.createElement('li');
        append = true;
    }

    li.innerHTML = `<b>${data.name}</b> (${active ? 'gestart' : 'niet gestart'})`;
    li.setAttribute('data-game-id', data.id);

    if (append) {
        ul.appendChild(li);
    }
}

socket.on('game:existing', (data) => {
    const elementId = data.active ? 'games-active' : 'games-queue';

    fillGames(data, elementId, !data.active);
    fillPicker(data, 'games-picker', data.active);
});

socket.on('game:initialized', (data) => {
    fillGames(data, 'games-queue', true);
    fillPicker(data, 'games-picker', data.active);
});

document.getElementById('new-game').onsubmit = (evt) => {
    const checkNumber = (number) => {
        // Defaults to 42, just for giggles. Just put in the correct numbers.
        return !isNaN(number) ? parseInt(number) : 42;
    };
    const inputArray = Array.from(evt.target.querySelectorAll('[data-field]'));
    let data = {};

    for (const input of inputArray) {
        if (input.value) {
            if (input.name.includes('.')) {
                // TODO: Probably no need, but this could be rewritten to support endless dots in the name..
                const sub = input.name.split('.');
                data[sub[0]] = {};
                data[sub[0]][sub[1]] = input.value;
            } else {
                data[input.name] = input.value;
            }
        }
    }

    // Special comma sperated value handle.
    if (data.points !== undefined) {
        const pointArray = data.points.split(',');
        data.points = {
            red: checkNumber(pointArray[0]),
            green: checkNumber(pointArray[1]),
            blue: checkNumber(pointArray[2])
        }
    }

    // Add the password, otherwise you can't do anything.
    appendPassword(data);

    socket.emit('game:create', data);

    return false;
};

////////////////////////////////////////////////////////////////////////////////
/// POINT INPUT BITS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
socket.on('game:team:names', (data) => {
    for (const key in data) {
        const element = document.getElementById(key).querySelector('.team-name');

        if (element) {
            element.textContent = data[key];
        }
    }
});

document.getElementById('games-picker').onclick = (evt) => {
    if (evt.target.nodeName !== 'LI') {
        return;
    }
    let obj = {
        id: evt.target.getAttribute('data-game-id')
    };

    appendPassword(obj);

    socket.emit('game:focus', obj);
    socket.emit('game:request:team:names', obj);

    // Enable the section for the points.
    evt.target.parentNode.parentNode.parentNode.nextElementSibling.classList.remove('section-disabled');

    // If game is chosen, hide the picker section.
    evt.target.parentNode.parentNode.parentNode.classList.add('hidden');
}

document.getElementById('station-delegation').onclick = (evt) => {
    if (evt.target.nodeName !== 'BUTTON') {
        return;
    }

    let obj = {
        action: evt.target.getAttribute('data-action')
    };

    appendPassword(obj);

    socket.emit('game:points', obj);
};

////////////////////////////////////////////////////////////////////////////////
/// DASHBOARD BITS - TIMER /////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
let gameStatic = null;

class Timer {
    constructor (obj) {
        this.progressBar = document.getElementById('progress-bar');
        this.timeDisplay = document.getElementById('remaining-time');

        this.totalTime = obj.totalTime;
        this.timeLeft = obj.currentTime;

        this.timeStep = 1000;
        this.timer = null;
    }

    startTimer () {
        this.clearTimer();

        this.timer = window.setInterval(() => {
            this.timeLeft -= this.timeStep;

            this.display();
            this.setProgress();


            if (this.timeLeft <= 0) {
                this.clearTimer();
            }
        }, this.timeStep);
    }

    display () {
        this.timeDisplay.textContent = this.msToTime(this.timeLeft);
    }
    setProgress () {
        const partLeft = this.totalTime - this.timeLeft;
        const percentage = getPercentage(partLeft, this.totalTime);

        this.progressBar.style.width = percentage + '%';
    }

    clearTimer () {
        if (this.timer) {
            window.clearInterval(this.timer);
        }
    }

    reset () {
        this.timeLeft = this.totalTime;
        this.startTimer();
    }

    msToMinute (ms) {
        return parseInt((ms / (1000 * 60)) % 60);
    }
    msToTime (duration) {
        let seconds = parseInt((duration / 1000) % 60);
        let minutes = this.msToMinute(duration);

        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return minutes + ":" + seconds;
    }
}

let progressTimer = null;

socket.on('game:initial:statistics', (data) => {
    if (progressTimer === null) {
        progressTimer = new Timer(data);
    }

    if (data.started) {
        progressTimer.startTimer();
    }

    gameStatistic(data);
});

socket.on('game:started', () => {
    if (progressTimer !== null) {
        progressTimer.startTimer();
    }
})

socket.on('game:reset:timer', () => {
    if (progressTimer !== null) {
        progressTimer.reset();
    }
});




////////////////////////////////////////////////////////////////////////////////
/// DASHBOARD BITS - STATUS ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
const gameStat = document.getElementById('game-stats').querySelector('h1');

function calculatePoints (obj) {
    const pointObj = Object.assign({}, obj.score);
    const teams = ['team1', 'team2'];
    const temp = {};

    for (const team of teams) {
        let teampoints = 0;

        for (const round in pointObj) {
            teampoints += pointObj[round][team];
        }
        temp[team] = teampoints;
    }

    pointObj.total = temp;

    return pointObj;
}

function gameStatistic (obj) {
    const points = calculatePoints(obj);

    gameStat.textContent = `Ronde: ${obj.round}. Totaal punten: ${obj.teams.team1}: ${points.total.team1} |  ${obj.teams.team2}: ${points.total.team2}`;
}

socket.on('game:ongoing:statistics', (data) => {
    gameStatistic(data);
});

////////////////////////////////////////////////////////////////////////////////
/// DASHBOARD BITS - PIE-CHARTS ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////