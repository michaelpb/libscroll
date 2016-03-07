'use strict';
const _ = require('lodash');
const taglex = require('taglex');

// Node types:
const TEXT        = 1; exports.TEXT       = TEXT;
const TAG         = 2; exports.TAG        = TAG;
const OPEN_TAG    = 3; exports.OPEN_TAG   = OPEN_TAG;
const CLOSE_TAG   = 4; exports.CLOSE_TAG  = CLOSE_TAG;
const NODE_ENTER  = 5; exports.NODE_ENTER = NODE_ENTER;
const NODE_EXIT   = 6; exports.NODE_EXIT  = NODE_EXIT;


// ScrollMarkdownParser sets up a parser using TagLex
// emit function:
// (type, tag, contents)
// E.G.:
// (TEXT,       null,         "Asdf")
// OR:
// (OPEN_TAG,   [Tag object], null)
// (CLOSE_TAG,  [Tag object], null)

const TagLexParser = function (tagloader, opts) {
    // One of these should be generated per document, and needs to be
    // re-compiled if the documents tagset changes
    let defs = {
        emit_source: false,
        trim_doc: true,
    };
    this.opts         = _.extend(defs, opts);
    this.tagloader    = tagloader;
    this.tags         = tagloader.all_tags;
    this.tag_contexts = {};

    // taglex stuff
    this.ruleset = null;
    this.classes = null;
};

TagLexParser.prototype.parse = function (text, emit, done) {
    if (this.opts.trim_doc) {
        text = _.str.trim(text);
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
};



let get_parser = function (type, tagloader, opts) {
    let TYPES = {
        md: ScrollMarkdownParser,
        markdown: ScrollMarkdownParser,
    };

    let parser_class = TYPES[type.toLowerCase()];

    if (parser_class) {
        return new parser_class(tagloader, opts);
    } else {
        throw new Error("Unknown file type: " + md);
    }
};

