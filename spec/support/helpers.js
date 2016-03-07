'use strict';
const Filetype = require('../../mods/filetype/Filetype');
const Workspace = require('../../mods/workspace/ScrollWorkspace');
const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
const StructuredParser = require('../../lib/parser/StructuredParser');
const EditorRenderer = require('../../lib/renderer').EditorRenderer;
const Tag = require('../../mods/document/Tag');
const Structure = require('../../mods/style/Structure');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "data"));

const JUST_TAGS = [new Filetype(Tag, () => true)];
const JUST_STRUCTURE = [new Filetype(Structure, () => true)];

const WORKSPACE = new Workspace(PATH_PREFIX, []);
const get_workspace = () => WORKSPACE;

exports.load_tags = function (callback) {
    glob("tags/*.cfg", {cwd: PATH_PREFIX}, (err, paths) => {
        if (err) { throw err; }
        Filetype.load_all(JUST_TAGS, paths, get_workspace, callback);
    });
};

exports.load_para = function (callback) {
    Filetype.load_all(JUST_TAGS, ["tags/para.cfg"], get_workspace, callback);
};

exports.load_parser = function (cb, opts = {}) {
    const func = (opts.ONLY_DO_PARA ? exports.load_para : exports.load_tags);
    func(tags => {
        if (tags.length < 6 && !opts.ONLY_DO_PARA) {
            throw new Error('Cannot complete test: Too few tags: ' + tags.length);
        }
        const parser = new ScrollMarkdownParser(tags, opts);
        parser.compile(() => cb(parser));
    });
};

exports.load_edit_renderer = function (opts, cb) {
    const popts = {emit_source: true};
    if (opts.ONLY_DO_PARA) {
        popts.ONLY_DO_PARA = true;
    }
    exports.load_parser(function (parser) {
        var renderer = new EditorRenderer(parser.tagloader, opts);
        renderer.compile(function () {
            cb(parser, renderer);
        });
    }, popts);
};

exports.load_structure = function (opts, callback) {
    const filename = opts.structure_file_name || 'structure2.cfg';
    Filetype.load_all(JUST_STRUCTURE, [`structure/${filename}`], get_workspace, callback);
};

exports.load_structure_parser = function (callback) {
    exports.load_tags(tags => {
        exports.load_structure({}, structure => {
            const parser = new StructuredParser(tags, structure, opts);
            parser.compile(function () {
                callback(parser);
            });
        });
    });
};


