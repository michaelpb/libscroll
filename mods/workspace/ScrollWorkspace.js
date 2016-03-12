'use strict';
const lodash = require('lodash');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const ScrollObject = require('../../lib/ScrollObject');
const {ObjectMatcher} = require('../../lib/objectmatcher');
const Filetype = require('../../mods/filetype/Filetype');

class ObjectContainer extends Array {
    constructor(objects) {
        super();

        for (const object of objects) {
            this.push(object);
            if (!(object.typename in this)) {
               this[object.typename] = [];
            }
            this[object.typename].push(object);
        }
    }

    get(matching_string) {
        const matcher = ObjectMatcher(matching_string);
        return this.find(object => matcher.match(object));
    }

    get_all(matching_string) {
        const matcher = ObjectMatcher(matching_string);
        return this.filter(object => matcher.match(object));
    }
}

class ScrollWorkspace extends ScrollObject {
    constructor(base_path, objects, is_partial = false) {
        super();
        this.objects = new ObjectContainer(objects);
        this.base_path = base_path;
        this.is_partial = is_partial; // true, if only partially loaded
    }

    static load(dir_path, callback) {
        // Other use, specify directory (for workspace)
        if (!dir_path.match(/\/$/)) {
            // not a directory
            throw new Error('Path must be directory');
        }

        const base_path = path.resolve(dir_path);

        // For now, just load defaults, no custom filetypes
        const filetypes = Filetype.defaults;

        // essentially, ls -R on the directory
        glob('**', {cwd: base_path, mark: true}, (error, paths) => {
            if (error) { throw error; }
            const constructor = objects => new ScrollWorkspace(base_path, objects, true);
            Filetype.load_all(filetypes, paths, constructor, objects => {
                const workspace = new ScrollWorkspace(base_path, objects);
                callback(workspace);
            });
        });
    }

    read(relative_path, callback) {
        const full_path = path.join(this.base_path, relative_path);
        fs.readFile(full_path, (error, data) => {
            if (error) { throw error; }
            callback(data);
        });
    }
}

module.exports = ScrollWorkspace;
