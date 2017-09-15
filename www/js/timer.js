'use strict';

class Timer {
    constructor (obj) {
        this.progressBar = obj.progressBarElement;
        this.timeDisplay = obj.timeDisplayElement;

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

    stopTime () {
        this.clearTimer();
        this.timeDisplay.textContent = "Spel is afgelopen!";
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
