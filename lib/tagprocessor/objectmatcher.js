'use strict';
const TagProcessor = require('./TagProcessor');

class ObjectMatcherProcessor extends TagProcessor {
    constructor(tag, options) {
        super();
        this.prefix = options && options.match[0].prefix;
        this.get = options && options.match[0].get;
    }

    render(text, callback) {
        const result = '';
        callback(html);
        // console.log('Rendering formula', html);
        return html;
    }
}

module.exports = ObjectMatcherProcessor;
