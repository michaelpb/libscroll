'use strict';
const lodash = require('lodash');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const ScrollObject = require('../../lib/ScrollObject');
const {ObjectMatcher} = require('../../lib/objectmatcher');
const Filetype = require('../../mods/filetype/Filetype');
const find_parent_dir = require('find-parent-dir');

const SCROLLID_FILENAME = '.scrollid';

const ACTIONS = {
    describe: function (object) {
        if (!(object instanceof ScrollObject)) {
            // use a matcher instead
            object = this.objects.get(object);
        }

        return {
            type: object.typename,
            actions: object._actions ? Object.keys(object._actions) : "None",
            info: {
                name: object.name,
                namespace: object.namespace,
                fullname: object.fullname,
                classnames: object.classnames,
            },
        };
    },
};

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

    /*
     * Finds a object with the given matching string
     */
    get(matching_string) {
        const matcher = new ObjectMatcher(matching_string);
        const result = this.find(object => matcher.match(object));
        if (!result) {
            return null;
        }
        return result;
    }

    get_all(matching_string) {
        const matcher = new ObjectMatcher(matching_string);
        return this.filter(object => matcher.match(object));
    }
}

class ScrollWorkspace extends ScrollObject {
    constructor(base_path, objects, is_partial = false) {
        super({}, {path: base_path});
        this.objects = new ObjectContainer(objects);
        this.base_path = base_path;
        this.is_partial = is_partial; // true, if only partially loaded

        // Loop through all the args attaching magic "workspace" property
        for (const object of objects) {
            object.workspace = this;
        }
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

    static find_parent_workspace(dir_path, callback) {
        // Walk up dir path looking for scroll working directory
        find_parent_dir(dir_path, SCROLLID_FILENAME, (error, result) => {
            if (error) { throw error; }
            callback(result);
        });
    }

    read(relative_path, callback) {
        const full_path = path.join(this.base_path, relative_path);
        fs.readFile(full_path, (error, data) => {
            if (error) { throw error; }
            callback(data);
        });
    }

    get _actions() {
        return ACTIONS;
    }
}

module.exports = ScrollWorkspace;
