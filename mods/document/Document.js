'use strict';
/*
The Document class encapsulates a single Document. A scroll workspace (e.g.
".scroll" file), may have more than one Document.
*/

const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
const TreeParser = require('../../lib/parser/TreeParser');
const EditorRenderer = require('../../lib/renderer').EditorRenderer;
//const Style = require('../style/Style');
const ScrollObject = require('../../lib/ScrollObject');
const async = require('async');

class Document extends ScrollObject {
    constructor(contents, parser, editor_parser, editor_renderer) {
        super();
        this.contents = contents;
        this.parser = parser;
        this.editor_parser = editor_parser;
        this.editor_renderer = editor_renderer;
    }

    static load(workspace, path, callback) {
        // Step 1, compile document parsers
        const actions = [];

        // just gets top structure for now
        const structure = workspace.objects.structure &&
            workspace.objects.structure[0] || null;
        let parser = null;
        if (structure) {
            // Has a structure, can build a TreeParser
            parser = new TreeParser(tagloader, structure);
            actions.push(done => parser.compile(done));
        }

        const tags = workspace.objects.tag || [];

        // Compile parser based ones
        const editor_parser =
            new ScrollMarkdownParser(tags, {emit_source: true});
        const editor_renderer = new EditorRenderer(tags);
        actions.push(done => editor_parser.compile(done));
        actions.push(done => editor_renderer.compile(done));

        let contents;
        actions.push(done => {
            workspace.read(path, data => {
                contents = data.toString();
                done();
            })
        });

        // Now perform all the necessary asynchronous actions
        async.parallel(actions, () => {
            const doc = new Document(
                contents, parser, editor_parser, editor_renderer);
            callback(doc);
        });
    }

    static get dependencies() {
        return ['tag', 'structure'];
    }
}

module.exports = Document;
