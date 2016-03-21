'use strict';
/*
The Document class encapsulates a single Document. A scroll workspace (e.g.
".scroll" file), may have more than one Document.
*/

const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
const TreeParser = require('../../lib/parser/TreeParser');
const UnstructuredTreeParser = require('../../lib/parser/UnstructuredTreeParser');
const {EditorRenderer, StyleRenderer} = require('../../lib/renderer');
const Style = require('../style/Style');
const Structure = require('../style/Structure');
const ScrollObject = require('../../lib/ScrollObject');
const Tag = require('./Tag');
const async = require('async');

const NOOP = () => {};

const ACTIONS = {
    render: function (render_target = 'default', style_name = null, structure_name = null) {
        const renderer = this.new_renderer(render_target, style_name);
        const parser = this.new_parser(render_target, structure_name);
        return renderer.render_to_string(this.contents, parser);
    },
    rendercss: function (render_target = 'default') {
        return Tag.render_css(this.workspace.objects.tag, render_target);
    },
};

class Document extends ScrollObject {
    constructor(...args) {
        super(...args);
        this.contents = this.info.document.contents;
    }

    static load(workspace, relpath, callback) {
        if (relpath.match(/.cfg$/)) {
            ScrollObject.new_from_cfg(Document, workspace, relpath, callback);
        } else {
            workspace.read(relpath, data => {
                const info = {document: {contents: data.toString()}};

                // TODO
                const meta = {path: relpath, name: 'document', namespace: 'default'};
                const doc = new Document(info, meta);
                // TODO
                doc.workspace = workspace;
                // doc.path = relpath;
                callback(doc);
            });
        }
    }

    new_renderer(target, style_name) {
        const tags = this.workspace.objects.tag;
        if (target === 'editor') {
            const editor_renderer = new EditorRenderer(tags);
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
        return style_renderer;
    }

    new_parser(target, structure_name = null) {
        const tags = this.workspace.objects.tag;

        if (target === 'editor') {
            const editor_parser =
                new ScrollMarkdownParser(tags, {emit_source: true});
            return editor_parser;
        }

        let structure;
        if (structure_name === null || structure_name === '_unstructured') {
            return new UnstructuredTreeParser(tags);
        } if (structure_name === '_markdown') {
            structure = Structure.new_from_containment(tags);
        } else if (structure_name === '_empty') {
            structure = Structure.EMPTY_STRUCTURE;
        } else {
            structure = this.workspace.get(structure_name);
            if (!structure) {
                throw new Error('Could not find structure: ' + style_name);
            }
        }

        return new TreeParser(tags, structure);
    }

    editor_render(fragment, refresh = false, emit_source = false) {
        if (refresh || !this.editor_renderer) {
            const tags = this.workspace.objects.tag;
            // Set up editor renderer and parser
            this.editor_renderer = new EditorRenderer(tags);
            this.editor_parser =
                new ScrollMarkdownParser(tags, {emit_source: emit_source});
        }
        return this.editor_renderer.render_to_string(fragment, this.editor_parser);
    }

    get _actions() {
        return ACTIONS;
    }

    static get dependencies() {
        return ['tag', 'structure'];
    }
}

module.exports = Document;
