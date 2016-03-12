'use strict';
/*
The Document class encapsulates a single Document. A scroll workspace (e.g.
".scroll" file), may have more than one Document.
*/

const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
const TreeParser = require('../../lib/parser/TreeParser');
const EditorRenderer = require('../../lib/renderer').EditorRenderer;
const Style = require('../style/Style');
const Structure = require('../style/Structure');
const ScrollObject = require('../../lib/ScrollObject');
const async = require('async');

const ACTIONS = {
    render: (render_target = 'editor', style_name = null, structure_name = null, callback) => {
        const renderer = this.new_renderer(render_target, style_name);
        const parser = this.new_parser(render_target, structure_name);
        return renderer.render_to_string(this.contents, parser, callback);
    },
};

class Document extends ScrollObject {
    constructor(info) {
        super(info);
        this.contents = info.document.contents;
    }

    static load(workspace, relpath, callback) {
        if (relpath.match(/.cfg$/)) {
            ScrollObject.new_from_cfg(Document, workspace, relpath, callback);
        } else {
            workspace.read(path, data => {
                const info = {document: {contents: data.toString()}};
                const doc = new Document(info);
                doc.workspace = workspace;
                callback(doc);
            });
        }
    }

    static old_load(workspace, path, callback) {
        // Step 1, compile document parsers
        const actions = [];

        const tags = workspace.objects.tag || [];

        // Compile editor parser + renderer
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
                contents, editor_parser, editor_renderer);
            doc.workspace = workspace;
            callback(doc);
        });
    }


    new_renderer(target, style_name) {
        const tags = this.workspace.objects.tag;
        if (target === 'editor') {
            const editor_renderer = new EditorRenderer(tags);
            editor_renderer().compile();
            return editor_renderer;
        }

        let style;
        if (style_name === null) {
            style = Style.EMPTY_STYLE;
        } else {
            style = this.workspace.get(style_name);
            if (!style) {
                throw new Error('Could not find style: ' + style_name);
            }
        }

        const style_renderer = new StyleRenderer(tags, style);
        style_renderer.compile();
        return style_renderer;
    }

    new_parser(target, structure_name) {
        const tags = this.workspace.objects.tag;

        if (target === 'editor') {
            const editor_parser =
                new ScrollMarkdownParser(tags, {emit_source: true});
            editor_parser().compile();
            return editor_parser;
        }

        let structure;
        if (structure_name === null) {
            structure = Structure.EMPTY_STRUCTURE;
        } else {
            structure = this.workspace.get(style_name);
            if (!style) {
                throw new Error('Could not find style: ' + style_name);
            }
        }

        return new TreeParser(tags, structure);
    }

    get _actions() {
        return ACTIONS;
    }

    static get dependencies() {
        return ['tag', 'structure'];
    }
}

module.exports = Document;
