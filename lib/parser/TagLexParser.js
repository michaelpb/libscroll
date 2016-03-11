'use strict';
const lodash = require('lodash');
const taglex = require('taglex');
const {TEXT, TAG, OPEN_TAG, CLOSE_TAG, NODE_ENTER, NODE_EXIT, NODE}
    = require('./constants');

// ScrollMarkdownParser sets up a parser using TagLex
// emit function:
// (type, tag, contents)
// E.G.:
// (TEXT,       null,         "Asdf")
// OR:
// (OPEN_TAG,   [Tag object], null)
// (CLOSE_TAG,  [Tag object], null)

class TagLexParser {
    constructor(tags, opts) {
        // One of these should be generated per document, and needs to be
        // re-compiled if the documents tagset changes
        const defs = {
            emit_source: false,
            trim_doc: true,
        };
        this.opts         = Object.assign(defs, opts);
        this.tags         = tags;
        this.tag_contexts = {};

        // taglex stuff
        this.ruleset = null;
        this.classes = null;
    }

    parse(text, emit, done) {
        if (this.opts.trim_doc) {
            text = lodash.trim(text);
        }

        let source = null; // holds the last source code we received
        let _bufferer = null;
        let parser = null;
        let _parser = this.ruleset.new_parser();

        if (this.opts.emit_source) {
            _bufferer = new taglex.SourceBufferer(_parser, taglex.ROOT);
            parser = _bufferer;
        } else {
            parser = _parser;
        }

        parser.on("source_buffer", function (s) {
            source = s;
        });

        parser.on('tag_open', function (payload) {
            emit(OPEN_TAG, payload, source);
            if (source) { source = null; } // consume source
        });

        parser.on('symbol', function (payload) {
            // just a hack, do open and close to simulate a symbol no-op
            emit(OPEN_TAG, payload, null);
            emit(CLOSE_TAG, payload, null);
        });

        parser.on('text_node', function (text) {
            emit(TEXT, null, text);
        });

        parser.on('tag_close', function (payload) {
            emit(CLOSE_TAG, payload, null);
        });

        _parser.write(text);
        parser.end();
        done();
    }
};

module.exports = TagLexParser;
