'use strict';
const TagRenderer = require('./TagRenderer');

let katex;

class KatexTagRenderer extends TagRenderer {
    constructor(tag) {
        super();
        katex = require('katex');

        // TODO: determine options
        this.opts = {
            displayMode: false, // inline
            throwOnError: false, // render error instead
        };
    }

    render(tree_node, callback) {
        const text = tree_node.inner_text;
        const html = katex.renderToString(text, this.opts);
        callback(html);
        return html;
    }

    rendercss(tree_node, callback) {
        // needs to include CSS file
    }
}

module.exports = KatexTagRenderer;
