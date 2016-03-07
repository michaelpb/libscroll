'use strict';
const lodash = require('lodash');
const glob = require('glob');
const path = require('path');

const ScrollObject = require('../../lib/ScrollObject');
const Filetype = require('../../mods/filetype/Filetype');

class ObjectContainer extends Array {
    constructor(objects) {
        super();

        for (const object of objects) {
            this.push(object);
            const name = object.constructor.name;
            if (!(name in this)) {
                this[name] = [];
            }
            this[name].push(object);
        }
    }
}

class ScrollWorkspace extends ScrollObject {
    constructor(objects, is_partial = false) {
        super();
        this.objects = new ObjectContainer(objects);
        this.is_partial = is_partial; // true, if only partially loaded
    }

    static load(dir_path, callback) {
        // Other use, specify directory (for workspace)
        if (!dir_path.match(/\/$/)) {
            // not a directory
            throw new Error('Path must be directory');
        }

        // TODO: this has no manifest support
        const base_path = path.resolve(dir_path);

        // For now, just load defaults, no custom filetypes
        const filetypes = Filetype.defaults;

        // essentially, ls -R on the directory
        glob('**', {cwd: base_path, mark: true}, (error, paths) => {
            if (error) { throw error; }
            const constructor = objects => new ScrollWorkspace(objects, true);
            Filetype.load_all(filetypes, paths, constructor, objects => {
                const workspace = new ScrollWorkspace(objects);
                callback(workspace);
            });
        });
    }
}

module.exports = ScrollWorkspace;
