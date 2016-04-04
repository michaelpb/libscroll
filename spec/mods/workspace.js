'use strict';
const fs = require('fs');
const path = require('path');
const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "data"));
const fixtures = require('../support/fixtures');

const normalize = s => s.split(".").sort().join(".");

describe('ScrollWorkspace', () => {
    it('instantiates an empty instance', () => {
        const workspace = new ScrollWorkspace('', []);
        expect(workspace.objects).toBeTruthy();
        expect(Array.from(workspace.objects)).toEqual([]);
    });

    it('can load a workspace', (done) => {
        const ws_path = path.join(PATH_PREFIX, 'workspaces', 'basic_ws/');
        ScrollWorkspace.load(ws_path, workspace => {
            expect(workspace).toBeTruthy();
            expect(workspace.is_partial).toEqual(false);
            expect(workspace.objects.document.length).toEqual(1);
            expect(workspace.objects.tag.length).toEqual(13);
            expect(workspace.objects.length).toEqual(14);
            done();
        });
    });

    it('can find a workspace in FS ancestry', (done) => {
        const ws_path = path.join(PATH_PREFIX, 'workspaces', 'basic_ws/');
        const example_file_path = path.join(ws_path, 'document', 'something');
        ScrollWorkspace.find_parent_workspace(example_file_path, result => {
            expect(result).toEqual(ws_path);
            done();
        });
    });

    it('can determine there is no workspace in FS ancestry', (done) => {
        const ws_path = path.join(PATH_PREFIX, 'workspaces', 'nonexistent/');
        const example_file_path = path.join(ws_path, 'document', 'something');
        ScrollWorkspace.find_parent_workspace(example_file_path, result => {
            expect(result).toEqual(null);
            done();
        });
    });

    it('has methods get and get_all that searches for scroll objects', () => {
        let tag;
        let tags;
        const workspace = fixtures.make_workspace();
        tag = workspace.objects.get('blockquote');
        expect(tag).toBeTruthy();
        expect(tag.name).toEqual('blockquote');
        tag = workspace.objects.get('nonexistant');
        expect(tag).toBeNull();

        tags = workspace.objects.get_all('blockquote');
        expect(tags.length).toEqual(1);
        expect(tags[0].name).toEqual('blockquote');
        tags = workspace.objects.get_all('nonexistant');
        expect(tags.length).toEqual(0);
        tags = workspace.objects.get_all('namespace:default');
        expect(tags.length).toEqual(6);
    });

    it('has the action describe which describes other objects', () => {
        const workspace = fixtures.make_workspace();
        expect(workspace.actions.describe('blockquote'))
            .toEqual({
                type: 'tag',
                actions: 'None',
                info: {
                    name: 'blockquote',
                    namespace: 'default',
                    fullname: 'default_blockquote',
                    classnames: ['text'],
                },
            });
    });

    it('can reload scroll objects after changes', () => {
        const workspace = fixtures.make_workspace();
        const doc = workspace.objects.document[0];
        const EXPECTED_CSS = normalize([
            '.default_blockquote { display: block; background: gray;} ',
            '.default_emphasis { text-variation: italic;} ',
            '.default_para { display: block; padding: 3px;} ',
            '.default_para > bk { display: inline;} ',
            '.default_para html { display: none;} ', // check prevents breakage
            '.default_section { display: block; font-size: 24pt;} ',
            '.default_strong { display: block; font-weight: bold;} '].join(''));

        expect(normalize(doc.actions.rendercss())).toEqual(EXPECTED_CSS);

        const tag = workspace.objects.get('blockquote');
        const new_contents = tag.meta.contents.replace('gray', 'blue');
        workspace.reload(tag, new_contents);
        const new_expected = EXPECTED_CSS.replace('gray', 'blue');
        expect(new_expected).not.toEqual(EXPECTED_CSS);
        expect(normalize(doc.actions.rendercss())).toEqual(new_expected);
    });

});
