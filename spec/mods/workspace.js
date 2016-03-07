'use strict';

const fs = require('fs');
const path = require('path');
const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const PATH_PREFIX = path.resolve(path.join(__dirname, "..", "testdata"));

describe('ScrollWorkspace', () => {
    let workspace;

    it('has an object property', () => {
        workspace = new ScrollWorkspace([]);
        expect(workspace.objects).toBeTruthy();
        expect(Array.from(workspace.objects)).toEqual([]);
    });

    it('can load a workspace', (done) => {
        const ws_path = path.join(PATH_PREFIX, 'data', 'workspaces', 'basic_ws/');
        ScrollWorkspace.load(ws_path, workspace => {
            expect(workspace).toBeTruthy();
            expect(workspace.is_partial).toEqual(false);
            done();
        });
    });
});
