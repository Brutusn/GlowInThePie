'use strict';

class Modal {
    constructor () {
        this.curtain = document.querySelector('.modal-curtain');
        this.modal = document.getElementById('modal');
        this.content = document.getElementById('modal-content');

        this.knownTypes = ['error', 'warning', 'info', 'success'];

        this.modalTimer = null;

        this.addClickEvent();
    }

    addClickEvent () {
        this.curtain.onclick = (evt) => {
            this.hide();
        }
    }

    clear () {
        this.setMessage('');
        this.hide();
    }
    clearTimer () {
        if (this.modalTimer) {
            window.clearTimeout(this.modalTimer);
        }
    }

    show () {
        this.curtain.classList.remove('hidden');

        this.clearTimer();
        this.modalTimer = window.setTimeout(this.hide.bind(this), 3000);
    }
    hide () {
        this.curtain.classList.add('hidden');
        this.clearTimer();
    }
    setType (type) {
        if (!this.knownTypes.includes(type)) {
            return;
        }

        for (const t of this.knownTypes) {
            this.modal.classList.remove(t);
        }
        this.modal.classList.add(type);
    }
    setMessage (msg) {
        this.content.textContent = msg;
        this.show();
    }

    message (msg) {
        let displaymsg = '';
        if (msg instanceof Object) {
            this.setType(msg.type);
            displaymsg = msg.message
        } else {
            displaymsg = msg;
        }
        this.setMessage(displaymsg);
    }
}

const modal = new Modal();
