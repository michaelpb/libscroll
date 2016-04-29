'use strict';
const _ = require('lodash');
const Filetype = require('../../mods/filetype/Filetype');
const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const ScrollMarkdownParser = require('../../lib/parser/ScrollMarkdownParser');
const StructuredParser = require('../../lib/parser/StructuredParser');
const TreeParser = require('../../lib/parser/TreeParser');
const fsutils = require('../../lib/utils/fsutils');
const {EditorRenderer, StyleRenderer} = require('../../lib/renderer');
const Tag = require('../../mods/document/Tag');
const Image = require('../../mods/media/Image');
const Structure = require('../../mods/style/Structure');
const glob = require('glob');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "data"));

const JUST_TAGS = [new Filetype(Tag, () => true)];
const JUST_IMAGES = [new Filetype(Image, () => true)];
const JUST_STRUCTURE = [new Filetype(Structure, () => true)];

const WORKSPACE = new ScrollWorkspace(PATH_PREFIX, []);
const get_workspace = () => WORKSPACE;

exports.load_tags = function (callback) {
    glob("tags/*.cfg", {cwd: PATH_PREFIX}, (err, paths) => {
        if (err) { throw err; }
        Filetype.load_all(JUST_TAGS, paths, get_workspace, callback);
    });
};

exports.load_images = function (callback) {
    glob("image/*", {cwd: PATH_PREFIX}, (err, paths) => {
        if (err) { throw err; }
        Filetype.load_all(JUST_IMAGES, paths, get_workspace, callback);
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
        cb(parser);
        // parser.compile(() => cb(parser));
    });
};

exports.load_edit_renderer = function (opts, cb) {
    const popts = {emit_source: true};
    if (opts.ONLY_DO_PARA) {
        popts.ONLY_DO_PARA = true;
    }
    exports.load_parser(function (parser) {
        var renderer = new EditorRenderer(parser.tags, opts);
        cb(parser, renderer);
        /*renderer.compile(function () {
        });*/
    }, popts);
};

exports.load_structure = function (opts, callback) {
    const filename = opts.structure_file_name || 'structure2.cfg';
    Filetype.load_all(JUST_STRUCTURE, [`structure/${filename}`], get_workspace,
        structures => callback(structures[0]));
};

exports.load_structure_parser = function (callback) {
    const opts = {};
    exports.load_tags(tags => {
        exports.load_structure({}, structure => {
            const parser = new StructuredParser(tags, structure, opts);
            callback(parser);
        });
    });
};

exports.load_tree_parser = function (callback) {
    const opts = {};
    exports.load_tags(tags => {
        exports.load_structure({}, structure => {
            const parser = new TreeParser(tags, structure, opts);
            callback(parser);
        });
    });
};

exports.load_style_renderer = function (opts, cb) {
    const {style} = opts;
    exports.load_tree_parser(parser => {
        const renderer = new StyleRenderer(parser.tags, style, opts);
        cb(parser, renderer);
        // renderer.compile(() => cb(parser, renderer));
    }, opts);
};

exports.load_workspace = function (callback) {
    const ws_path = path.join(PATH_PREFIX, 'workspaces', 'basic_ws/');
    ScrollWorkspace.load(ws_path, callback);
};

exports.tokens_side_by_side = function (list1, list2) {
    for (var i = 0; i < Math.max(list1.length, list2.length); i++) {
        var ch = '';
        if (_.isEqual(list1[i], list2[i])) {
            ch = " | ";
        } else {
            ch = " X ";
        }
        console.log(i, ch, list1[i], list2[i]);
    }
};

exports.pp_html = function (s1) {
    var html = require('html');
    console.log(html.prettyPrint(s1));
};

exports.html_diff = function (s1, s2) {
    var html = require('html');
    var s = function (v) { return html.prettyPrint(v).split("\n"); };
    return exports.tokens_side_by_side(s(s1), s(s2));
};

exports.ast_strip_tags = function (o) {
    // Cleans up the AST,  removing unneeded info, so we can do deep compares
    if (o.tag && o.tag.name) { o.tag = o.tag.name; }
    if (o.parent && o.parent.tag) { o.parent = o.parent.tag; }
    o.children.forEach(exports.ast_strip_tags);
    o.head.forEach(exports.ast_strip_tags);
    if (o.children.length < 1) { delete o.children; }
    if (o.head.length < 1) { delete o.head; }
    if (o.text === null) { delete o.text; }
    if (o.tag === null) { delete o.tag; }
    // clean up other non-essential fields
    delete o.is_unranked;
    delete o.rank;
};

exports.with_tmp_workspace = function (callback) {
    const ws_path = path.join(PATH_PREFIX, 'workspaces', 'basic_ws/');
    fsutils.get_free_tmp_dir(tmp_path => {
        tmp_path = tmp_path + '/'; // hack add trailing slash
        fse.copy(ws_path, tmp_path, () => {
            process.chdir(tmp_path);
            callback(tmp_path);
        });
    });
};
