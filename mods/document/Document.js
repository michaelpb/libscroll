'use strict';
/*
The Document class encapsulates a single Document. A scroll workspace (e.g.
".scroll" file), may have more than one Document.
*/
//const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
//const TreeParser = require('../../lib/parser/TreeParser');
//const EditorRenderer = require('../../lib/renderer/EditorRenderer');
//const Style = require('../style/Style');
const fs = require('fs');
const async = require('async');

class Document {
    constructor(contents, structure, parser, editor_parser, editor_renderer) {
        this.contents = contents;
        this.structure = structure;
        this.parser = parser;
        this.editor_parser = editor_parser;
        this.editor_renderer = editor_renderer;
    }

    static load(workspace, filedescriptor, callback) {
    }

    static get dependencies() {
        return [];
        return ['tag'];
    }
}

function prepare(tagloader, structure, callback) {
    /* ***************************************
     * Step 1, compile document parsers
     * *************************************** */
    // Compile parsers for the documents
    this.structure = structure;
    this.parser = new TreeParser(tagloader, this.structure);
    if (this.opts.prep_editor) {
        let emit_opts = { emit_source: true };
        this.editor.parser = new ScrollMarkdownParser(tagloader, emit_opts);
        this.editor.renderer = new EditorRenderer(tagloader);
    }

    let after = _.after(3, function () {
        callback();
    });

    this.parser.compile(after);
    this.editor.parser.compile(after);
    this.editor.renderer.compile(after);
};

module.exports = Document;
