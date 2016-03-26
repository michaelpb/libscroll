'use strict';
const TagRenderer = require('./TagRenderer');

let _hl = null;

class HiglightRenderer extends TagRenderer {
    constructor(tag) {
        super();
        this.tag = tag;
        if (_hl === null) {
            _hl = require("highlight").Highlight;
        }
    }

    render(tree_node, callback) {
        const code = tree_node.inner_content;
        const rendered = _hl(code);
        callback(rendered);
    }
}

module.exports = HiglightRenderer;
