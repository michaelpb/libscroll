'use strict';
const TagProcessor = require('./TagProcessor');

let katex;

class KatexTagProcessor extends TagProcessor {
    constructor(tag, options) {
        super();
        katex = require('katex');

        const display_mode = options && options.katex[0].display_mode
            && options.katex[0].display_mode === 'true';

        this.opts = {
            displayMode: display_mode,
            throwOnError: false, // render error instead
        };
    }

    render(text, callback) {
        const html = katex.renderToString(text, this.opts);
        callback(html);
        console.log('Rendering formula', html);
        return html;
    }

    rendercss(tree_node, callback) {
        // needs to include CSS file
    }
}

module.exports = KatexTagProcessor;
