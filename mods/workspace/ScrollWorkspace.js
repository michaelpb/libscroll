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
     * Replaces old object with new object
     */
    swap(old_object, new_object) {
        const index = this.findIndex(object => object === old_object);
        this[index] = new_object;
        this[old_object.typename] = this[old_object.typename].filter(object => object !== old_object);
        this[new_object.typename].push(new_object);
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

    new_atomic_change(object, content, description) {
        return {object, content, description};
    }

    save_change(atomic_change, callback) {
        const {object, content, description} = atomic_change;
        const new_file = this.reload(object, content);
        this.write_obj(new_file, callback);
    }

    reload(scrollobj, new_content) {
        const new_copy = ScrollObject.reload(scrollobj, new_content);
        this.objects.swap(scrollobj, new_copy);
        return new_copy;
    }

    read(relative_path, callback) {
        fs.readFile(this._path(relative_path), (error, data) => {
            if (error) { throw error; }
            callback(data);
        });
    }

    write(relative_path, contents, callback) {
        fs.writeFile(this._path(relative_path), contents, (error, data) => {
            if (error) { throw error; }
            callback(data);
        });
    }

    write_obj(scrollobj, callback) {
        this.write(scrollobj.path, scrollobj.meta.contents, callback);
    }

    _path(relative_path) {
        return path.join(this.base_path, relative_path);
    }

    resolve_relpath(relative_path) {
        return path.resolve(this.base_path, relative_path);
    }

    get _actions() {
        return ACTIONS;
    }
}

module.exports = ScrollWorkspace;
