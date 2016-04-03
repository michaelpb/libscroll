'use strict';
const TagProcessor = require('./TagProcessor');

class ObjectMatcherProcessor extends TagProcessor {
    constructor(tag, options) {
        super();
        this.objects = tag.workspace.objects;
        this.prefix = options && options.match && options.match[0].prefix || 'path:';
        this.get_actions = options && options.get;
        if (!this.get_actions) {
            this.get_actions = [{
                property: 'path',
            }];
        }
    }

    render(text, callback) {
        let result = '';
        const obj = this.objects.get('blockquote');
        if (!obj) {
            return '<?>'; // TODO needs tag processor error handling system
        }

        for (const action of this.get_actions) {
            if (action.property) {
                result += obj[action.property];
            }
        }

        callback(result);
        return result;
    }
}

module.exports = ObjectMatcherProcessor;
