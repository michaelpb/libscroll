'use strict';
/*
StructuredParser and Tree Parser

- TreeParser: Wraps around StructuredParser, generating fully hierarchical
  object / tree structures in memory, instead of flat streaming node emissions.
  Passes on all above emit events, also.
*/

const lodash = require('lodash');
const StructuredParser = require('./StructuredParser');
const {TEXT, TAG, OPEN_TAG, CLOSE_TAG, NODE_ENTER, NODE_EXIT, NODE, UNRANKED, ROOT}
    = require('./constants');

class TreeNode {
    constructor(tag, parent, rank) {
        if (lodash.isString(tag)) {
            this.is_text = true;
            this.text = tag;
            this.tag = null;
            this.is_unranked = true;
        } else {
            this.is_text = false;
            this.tag  = tag;
            this.text = null;
            // if rank is not a number, we are "unranked"
            this.is_unranked = !lodash.isNumber(rank);
        }
        this.parent   = parent;
        this.children = [];
        this.head     = [];
        this.rank     = rank;
    }
}

class TreeParser {
    constructor(tags, structure, opts) {
        this.opts = lodash.extend({}, opts);
        this.structure = structure;
        this.structuredparser =
            new StructuredParser(tags, structure, this.opts);
    }

    parse(text, emit, done) {
        const node_stack = [];
        let root = null;
        let top_node = null;
        let current_tag = null;

        const push = node => {
            // note: this makes assumptions about the markdown format
            if (top_node === null) { return; } // is root
            let tag = top_node.tag;

            // Decides if it should go in children or head
            if (top_node.rank === UNRANKED) {
                // Always go to children
                top_node.children.push(node);
            } else {
                // Either go to tag "head", or "children"
                if (current_tag === tag) {
                    // in top rank tag, go to head
                    top_node.head.push(node);
                } else {
                    top_node.children.push(node);
                }
            }
        };

        const pop_node = () => {
            let node = node_stack.pop();
            top_node = node_stack[node_stack.length-1] || null;
            return node;
        };

        const new_node = tag => {
            let tag_rank = this.structure.get_hierarchy_index(tag);
            let node = new TreeNode(tag, top_node, tag_rank);
            push(node); // push to head or children of top_node
            node_stack.push(node);
            top_node = node;
        };

        const append_text = text => {
            let node = new TreeNode(text, top_node, UNRANKED);
            push(node); // push to head or children of top_node
        };

        const on_token = (type, tag, text_content) => {
            switch (type) {
                case OPEN_TAG:
                    current_tag = tag;
                    emit(OPEN_TAG, tag, null);
                    break;
                case CLOSE_TAG:
                    current_tag = null;
                    emit(CLOSE_TAG, tag, null);
                    break;
                case NODE_ENTER:
                    emit(NODE_ENTER, tag, null);
                    new_node(tag);
                    break;
                case NODE_EXIT:
                    emit(NODE_EXIT, tag, null);
                    let node = pop_node();
                    emit(NODE, node, null);
                    break;
                case TEXT:
                    emit(TEXT, null, text_content);
                    append_text(text_content);
                    break;
            }
        };

        let result = null;
        const on_end = () => {
            // Give Root node to callback
            result = root;
            done(root);
        };

        // Set up root
        new_node(ROOT);
        root = top_node;

        this.structuredparser.parse(text, on_token, on_end);

        // Return the result also
        return result;
    }
}

module.exports = TreeParser;
module.exports.TreeNode = TreeNode;
