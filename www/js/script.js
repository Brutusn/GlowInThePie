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
const socket = io(location.host);

socket.on('growl', (data) => {
    console.info(data);
    modal.message(data);
});

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
document.getElementById('games-picker').onclick = (evt) => {
    if (evt.target.nodeName !== 'LI') {
        return;
    }
    let obj = {
        id: evt.target.getAttribute('data-game-id')
    };

    appendPassword(obj);

    socket.emit('game:focus', obj);

    // If game is chosen, hide the picker.
    evt.target.parentNode.parentNode.classList.add('hidden');
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
/// DASHBOARD BITS /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
