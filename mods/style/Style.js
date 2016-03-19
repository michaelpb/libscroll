'use strict';

// Pull in style schema
const ScrollObject = require('../../lib/ScrollObject');
const SCHEMA = require('./schemas').style;

class Style extends ScrollObject {
    constructor(...args) {
        super(...args);
        this.templates = null;

        // v-- remove me
        // this.meta = this.info.style;
    }

    static get EMPTY_STYLE() {
        return new Style({template: [], namespace: 'default', name: 'empty'});
    }

    compile(callback) {
        callback();
    }

    get_root() {
        for (var i in this.info.template) {
            var tinfo = this.info.template[i];
            if (tinfo.match.matches_root()) {
                return tinfo;
            }
        }
    }

    get_style(tag) {
        // Check for tag
        for (var i in this.info.template) {
            var tinfo = this.info.template[i];
            if (tinfo.match.match(tag)) {
                return tinfo;
            }
        }
        return null;
    }
}

module.exports = Style;
