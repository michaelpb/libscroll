/*
StructuredParser and Tree Parser

- StructuredParser: Wraps around ScrollMarkdownParser, injecting "NODE_ENTER"
  and "NODE_EXIT" based on rules found in a Structure object

- TreeParser: Wraps around StructuredParser, generating fully hierarchical
  object / tree structures in memory, instead of flat streaming node emissions.
  Passes on all above emit events, also.
*/

var _ = require('lodash');
var ScrollMarkdownParser = require('./ScrollMarkdownParser');

// Node types:
var TEXT        = 1; exports.TEXT       = TEXT;
var TAG         = 2; exports.TAG        = TAG;
var OPEN_TAG    = 3; exports.OPEN_TAG   = OPEN_TAG;
var CLOSE_TAG   = 4; exports.CLOSE_TAG  = CLOSE_TAG;
var NODE_ENTER  = 5; exports.NODE_ENTER = NODE_ENTER;
var NODE_EXIT   = 6; exports.NODE_EXIT  = NODE_EXIT;
var NODE        = 7; exports.NODE       = NODE;

var TreeNode = function (tag, parent, rank) {
    if (_.isString(tag)) {
        this.is_text = true;
        this.text = tag;
        this.tag = null;
        this.is_unranked = true;
    } else {
        this.is_text = false;
        this.tag  = tag;
        this.text = null;
        // if rank is not a number, we are "unranked"
        this.is_unranked = !_.isNumber(rank);
    }
    this.parent   = parent;
    this.children = [];
    this.head     = [];
    this.rank     = rank;

};

var TreeParser = function (tagloader, structure, opts) {
    var defs = {};
    this.opts = _.extend(defs, opts);
    this.structure = structure;
    this.structuredparser = new StructuredParser(tagloader,
                                                 structure, this.opts);
};

TreeParser.prototype.compile = function (callback) {
    this.structuredparser.compile(callback);
};

TreeParser.prototype.parse = function (text, emit, done) {
    var root = null;
    var node_stack = [];
    var top_node = null;
    var current_tag = null;
    var struct = this.structure;

    var push = function (node) {
        // note: this makes assumptions about the markdown format
        if (top_node === null) { return; } // is root
        var tag = top_node.tag;

        // Decides if it should go in children or head
        if (top_node.rank === struct.UNRANKED) {
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

    var pop_node = function () {
        var node = node_stack.pop();
        top_node = node_stack[node_stack.length-1] || null;
        return node;
    };

    var new_node = function (tag) {
        var tag_rank = struct.get_hierarchy_index(tag);
        var node = new TreeNode(tag, top_node, tag_rank);
        push(node); // push to head or children of top_node
        node_stack.push(node);
        top_node = node;
    };

    var append_text = function (text) {
        var node = new TreeNode(text, top_node, struct.UNRANKED);
        push(node); // push to head or children of top_node
    };

    var on_token = function (type, tag, text_content) {
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
                var node = pop_node();
                emit(NODE, node, null);
                break;
            case TEXT:
                emit(TEXT, null, text_content);
                append_text(text_content);
                break;
        }
    };

    var on_end = function () {
        // Give Root node to callback
        done(root);
    };

    // Set up root
    new_node(struct.ROOT);
    root = top_node;

    this.structuredparser.parse(text, on_token, on_end);
};

module.exports = TreeParser;
module.exports.TreeNode = TreeNode;
