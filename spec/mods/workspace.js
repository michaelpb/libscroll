'use strict';

const fs = require('fs');
const path = require('path');
const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "data"));

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
});
