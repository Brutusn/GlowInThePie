/**
 * File to handle passwords. absolutely not secure in any way, just to make it
 * a little harder to hack the game during playtime.
 */
'use strict';

const crypto = require('crypto');

// Password hash, for the super secret password!
const passwordHash = 'a20ee0145dd3935739bcc1036c0a1bff610516c521f3f0838b7ebe9919159e7e1019099090f37f499b18af89048b279f894957093028c5c6fdc42eb34ca99701';

const getHash = (string) => {
    return crypto.createHash('sha512').update(string).digest('hex');
}

// See if the password is good.
module.exports.compare = (pass) => {
    let bool = false;
    if (getHash(pass) === passwordHash) {
        bool = true;
    } else {
        console.warn('Wrong password entered: ', pass);
    }

    return bool;
}

module.exports.giveHash = (string) => getHash(string);
