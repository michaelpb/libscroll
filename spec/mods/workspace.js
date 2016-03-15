'use strict';
const fs = require('fs');
const path = require('path');
const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "data"));
const fixtures = require('../support/fixtures');

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
                }
            });
    });
});
