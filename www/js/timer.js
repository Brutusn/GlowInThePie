'use strict';

class Timer {
    constructor (obj) {
        this.progressBar = obj.progressBarElement;
        this.timeDisplay = obj.timeDisplayElement;
        this.roundInfo = obj.roundInfoElement;

        this.totalTime = obj.totalTime;
        this.timeLeft = obj.currentTime;

        this.round = obj.round;

        this.timeBase = 1000;
        this.timeStep = 1000;
        this.timer = null;
    }

    startTimer () {
        this.clearTimer();

        this.timer = window.setInterval(() => {
            // Always remove 1 second. Although sometimes (based on the factor) the time substracted more often.
            this.timeLeft -= this.timeBase;

            this.display();
            this.setProgress();


            if (this.timeLeft <= 0) {
                this.clearTimer();
            }
        }, this.timeFactor);
    }

    display () {
        const current = this.msToTime(this.timeLeft);

        this.timeDisplay.textContent = current;
        this.roundInfo.textContent = `Ronde: ${this.round} (${current}). `;
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

    stopTime () {
        this.clearTimer();
        this.timeDisplay.textContent = "Spel is afgelopen!";
    }

    static msToMinute (ms) {
        return parseInt((ms / (1000 * 60)) % 60);
    }
    msToTime (duration) {
        let seconds = parseInt((duration / 1000) % 60);
        let minutes = this.msToMinute(duration);

        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return minutes + ":" + seconds;
    }

    get timeFactor () {
        return this.timeStep;
    }
    set timeFactor (factor) {
        // Bases on the original 1000 ms
        factor = factor || 1;

        this.timeStep = Math.round(this.timeBase / factor);

        this.startTimer();
    }
    // Shouldn't be part of the timer.. but is for now
    roundNr(nr) {
        this.round = nr;
    }
}
