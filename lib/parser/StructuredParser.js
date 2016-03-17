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

class StructuredParser {
    constructor(tags, structure, opts) {
        const defs = {parserclass: ScrollMarkdownParser};
        this.opts = Object.assign(defs, opts);
        this.structure = structure;
        this.textparser = new this.opts.parserclass(tags, this.opts);
        this.reset();
    }

    reset() {
        this.emit = null;
        this.tag_stack = null;
    }

    _peak() {
        return this.tag_stack[this.tag_stack.length - 1];
    }

    handle_open(tag) {
        const tag_rank = this.structure.get_hierarchy_index(tag);
        if (tag_rank === UNRANKED) {
            // unranked, does not create ToC, do default / generic
            this.emit(NODE_ENTER, tag);
            this.emit(OPEN_TAG, tag);
            return;
        }

        // Otherwise, do popping operation
        let top_tag = this._peak();
        while (top_tag &&
                tag_rank <= this.structure.get_hierarchy_index(top_tag)) {
            ////// is HIGHER RANK or equal than top
            this.emit(NODE_EXIT, this.tag_stack.pop());
            top_tag = this._peak();
        }

        this.emit(NODE_ENTER, tag, null);
        this.emit(OPEN_TAG,   tag, null);
        this.tag_stack.push(tag);
    }

    handle_close(tag) {
        this.emit(CLOSE_TAG, tag, null);

        const tag_rank = this.structure.get_hierarchy_index(tag);
        if (tag_rank === UNRANKED) {
            // unranked, does not create ToC, do default / generic
            this.emit(NODE_EXIT, tag, null);
        }
    }

    on_token(type, tag, text_content) {
        if (type === OPEN_TAG) {
            //console.log("Open", tag.name);
            this.handle_open(tag);
        } else if (type === CLOSE_TAG){
            //console.log("Close", tag.name);
            this.handle_close(tag);
        } else {
            //console.log("Text", text_content);
            this.emit(TEXT, null, text_content);
        }
    }

    parse(text, emit, done) {
        this.tag_stack = [];
        this.emit = emit;
        this.textparser.parse(text, this.on_token.bind(this), () => {
            // pop whatever remains, emitting them
            while (this.tag_stack.length > 0) {
                this.emit(NODE_EXIT, this.tag_stack.pop(), null);
            }

            // Clean up to null-ify
            this.reset();
            done();
        });
    }
};

module.exports = StructuredParser;
