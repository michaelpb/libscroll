'use strict';
/*
- UnstructuredTreeParser: Wraps around ScrollMarkdownParser, generating fully
  hierarchical object / tree structures in memory. However, unlike TreeParser,
  it does it solely based on the markdown hierarchy, thus not requiring any
  sort of Structure object, and thus producing a result that is 1 to 1 with the
  original markdown document.

  It is used for "default" rendering strategies, if styles + structures are not
  specified.
*/

const lodash = require('lodash');
const ScrollMarkdownParser = require('./ScrollMarkdownParser');
const {TEXT, TAG, OPEN_TAG, CLOSE_TAG, NODE_ENTER, NODE_EXIT, NODE, UNRANKED, ROOT}
    = require('./constants');
const TreeNode = require('./TreeNode');

class UnstructuredTreeParser {
    constructor(tags, opts) {
        this.opts = lodash.extend({}, opts);
        this.parser =
            new ScrollMarkdownParser(tags, this.opts);
    }

    parse(text, emit, done) {
        // TODO: refactor this, possibly refactor/combine with vanilla
        // TreeParser
        const node_stack = [];
        let root = null;
        let top_node = null;
        let current_tag = null;

        const push = node => {
            // note: this makes assumptions about the markdown format
            if (top_node === null) { return; } // is root
            let tag = top_node.tag;
            // Always go to children
            top_node.children.push(node);

            /*
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
            */
        };

        const pop_node = () => {
            let node = node_stack.pop();
            top_node = node_stack[node_stack.length-1] || null;
            return node;
        };

        const new_node = tag => {
            // let tag_rank = this.structure.get_hierarchy_index(tag);
            let node = new TreeNode(tag, top_node, UNRANKED);
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
                    emit(NODE_ENTER, tag, null);
                    new_node(tag);
                    break;

                case CLOSE_TAG:
                    current_tag = null;
                    emit(CLOSE_TAG, tag, null);
                    emit(NODE_EXIT, tag, null);
                    let node = pop_node();
                    emit(NODE, node, null);
                    break;

                /*
                case NODE_ENTER:
                    emit(NODE_ENTER, tag, null);
                    new_node(tag);
                    break;
                case NODE_EXIT:
                    emit(NODE_EXIT, tag, null);
                    let node = pop_node();
                    emit(NODE, node, null);
                    break;
                */
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

        this.parser.parse(text, on_token, on_end);

        // Return the result also
        return result;
    }
}

module.exports = UnstructuredTreeParser;
module.exports.TreeNode = TreeNode;
