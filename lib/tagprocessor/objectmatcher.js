'use strict';
const TagProcessor = require('./TagProcessor');
const lodash = require('lodash');

class ObjectMatcherProcessor extends TagProcessor {
    constructor(tag, options) {
        super();
        this.objects = tag.workspace.objects;
        this.prefix = options && options.match && options.match[0].prefix || 'path:';
        this.get_actions = options && options.get;
        if (!this.get_actions) {
            this.get_actions = [{
                property: 'fullpath',
            }];
        }
    }

    render(text, callback) {
        let result = '';
        text = lodash.trim(text);
        const search = this.prefix + text;
        const obj = this.objects.get(search);
        if (!obj) {
            result = '<?>'; // TODO needs tag processor error handling system
        } else {
            for (const action of this.get_actions) {
                if (action.property) {
                    result += obj[action.property];
                }
            }
        }

        callback(result);
        return result;
    }
}

module.exports = ObjectMatcherProcessor;
