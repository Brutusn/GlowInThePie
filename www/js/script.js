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
});

////////////////////////////////////////////////////////////////////////////////
/// ADMIN BITS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

document.getElementById('games-queue').onclick = (evt) => {
    if (evt.target.nodeName === 'BUTTON') {
        const id = evt.target.getAttribute('data-start');
        let obj = {
            id: id
        };

        appendPassword(obj);

        socket.emit('game:start', obj);

        // Remove the clicked LI item.
        evt.target.parentNode.parentNode.removeChild(evt.target.parentNode);
    }
}

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

socket.on('game:existing:queue', (data) => {
    fillGames(data, 'games-queue', true);
});
socket.on('game:existing:active', (data) => {
    fillGames(data, 'games-active', false);
});

socket.on('game:initialized', (data) => {
    fillGames(data, 'games-queue', true);
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


////////////////////////////////////////////////////////////////////////////////
/// DASHBOARD BITS /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
