'use strict';
const TagProcessor = require('./TagProcessor');
const path = require('path');

class CSSIncludeTagProcessor extends TagProcessor {
    constructor(tag, options) {
        super();
        this.tag_base_path = path.dirname(tag.fullpath);
        this.includes = options.include || [];
    }

    render_head(callback) {
        let result = '';
        for (const include of this.includes) {
            const full_path = path.resolve(this.tag_base_path, include.path);
            const link = '<link rel="stylesheet" type="text/css" ' +
                `href="file://${full_path}" />`;
            result += link;
        }
        callback(result);
        return result;
    }
}

module.exports = CSSIncludeTagProcessor;
