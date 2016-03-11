'use strict';
/*
StructuredParser and Tree Parser
- StructuredParser: Wraps around ScrollMarkdownParser, injecting "NODE_ENTER"
  and "NODE_EXIT" based on rules found in a Structure object
*/

const ScrollMarkdownParser = require('./ScrollMarkdownParser');
const {TEXT, TAG, OPEN_TAG, CLOSE_TAG, NODE_ENTER, NODE_EXIT, NODE}
    = require('./constants');

const {UNRANKED} = require('../../lib/parser/constants');

const StructuredParser = function (tags, structure, opts) {
    var defs = {
        parserclass: ScrollMarkdownParser,
    };
    this.opts = Object.assign(defs, opts);
    this.structure = structure;
    this.textparser = new this.opts.parserclass(tags, this.opts);
};

StructuredParser.prototype.compile = function (callback) {
    this.textparser.compile(callback);
};

StructuredParser.prototype.parse = function (text, emit, done) {
    const struct = this.structure;
    const tag_stack = [];

    var handle_open = function (tag) {
        var tag_rank = struct.get_hierarchy_index(tag);
        if (tag_rank === UNRANKED) {
            // unranked, does not create ToC, do default / generic
            emit(NODE_ENTER, tag);
            emit(OPEN_TAG, tag);
            return;
        }

        // Otherwise, do popping operation
        var top_tag = tag_stack[tag_stack.length-1];
        while (top_tag && tag_rank <= struct.get_hierarchy_index(top_tag)) {
            ////// is HIGHER RANK or equal than top
            emit(NODE_EXIT, tag_stack.pop());
            top_tag = tag_stack[tag_stack.length-1];
        }

        emit(NODE_ENTER, tag, null);
        emit(OPEN_TAG,   tag, null);
        tag_stack.push(tag);
    };

    var handle_close = function (tag) {
        emit(CLOSE_TAG, tag, null);

        var tag_rank = struct.get_hierarchy_index(tag);
        if (tag_rank === UNRANKED) {
            // unranked, does not create ToC, do default / generic
            emit(NODE_EXIT, tag, null);
        }
    };

    var on_token = function (type, tag, text_content) {
        if (type === OPEN_TAG) {
            //console.log("Open", tag.name);
            handle_open(tag);
        } else if (type === CLOSE_TAG){
            //console.log("Close", tag.name);
            handle_close(tag);
        } else {
            //console.log("Text", text_content);
            emit(TEXT, null, text_content);
        }
    };

    var on_end = function () {
        // pop whatever remains, emitting them
        while (tag_stack.length > 0) {
            emit(NODE_EXIT, tag_stack.pop(), null);
        }
        done();
    };
    this.textparser.parse(text, on_token, on_end);
};

module.exports = StructuredParser;
