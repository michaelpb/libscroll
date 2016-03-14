'use strict';

const path = require('path');
const schemaconf = require('schemaconf');

class ScrollObjectActions {
    constructor(object, actions) {
        for (const key of Object.keys(actions)) {
            this[key] = actions[key].bind(object);
        }
    }
}

module.exports = ScrollObjectActions; 
