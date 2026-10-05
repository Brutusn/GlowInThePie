/**
 * File to handle passwords. absolutely not secure in any way, just to make it
 * a little harder to hack the game during playtime.
 */
'use strict';

const crypto = require('crypto');

const getHash = (string) => {
    return crypto.createHash('sha512').update(string).digest('hex');
}

// See if the password is good.
module.exports.compare = (pass) => {
    if (getHash(pass) === getHash(process.env.GITP_PASS)) {
        return true;
    }

    console.warn('Wrong password entered: ', pass);

    return false;
}

module.exports.giveHash = (string) => getHash(string);
