'use strict';
const fs = require('fs');
const path = require('path');

const TopoSort = require('topo-sort');
const async = require('async');

const ScrollObject = require('../../lib/ScrollObject');

function get_mod(name) {
    return require(`../../mods/${name.replace('.', '/')}`);
}

class Filetype extends ScrollObject {
    constructor(object_constructor, matcher = null, args = []) {
        super();
        this.object_constructor = object_constructor;
        this.object_name = object_constructor.name.toLowerCase();
        this.dependencies = object_constructor.dependencies || null;

        if (matcher === null) {
            // Match file with an extension in that directory
            matcher = new RegExp(`^${this.object_name}/.+\\..+`, 'i');
        }

        if (matcher instanceof RegExp) {
            const regexp_matcher = matcher;
            matcher = path => regexp_matcher.test(path);
        }

        this.matcher = matcher;
        this.args = args; // <-- TODO: implement
    }

    static load_all(filetypes, paths, make_partial_workspace, callback) {
        // First, we sort based on dependencies
        const sorter = new TopoSort();
        const filetypes_by_name = {};
        const already_loaded = new Set();
        const all_types = [];
        for (const filetype of filetypes) {
            if (filetype.dependencies) {
                sorter.add(filetype.object_name, filetype.dependencies);
            }

            all_types.push(filetype.object_name);
            filetypes_by_name[filetype.object_name] = filetype;
        }

        // Recursively load all items on the list
        const sorted_list = sorter.sort().concat(all_types);
        const loaded_objects = [];
        async.eachSeries(sorted_list, (name, finished_filetype) => {

            // To prevent filetypes from getting loaded twice
            if (already_loaded.has(name)) {
                return finished_filetype(); // skip ahead;
            } else {
                already_loaded.add(name);
            }

            const filetype = filetypes_by_name[name];
            if (!filetype) {
                console.error('known file types: ', Object.keys(filetypes_by_name));
                throw new Error(`Unknown dependency: "${name}"`);
            }
            const partial_workspace = make_partial_workspace(loaded_objects);

            // Get relevant paths, and open each file, passing the
            // open file to the loader
            const matched_paths = paths.filter(filetype.matcher);
            async.each(matched_paths, (relative_path, done) => {
                if (!filetype.object_constructor.load) {
                    throw new TypeError(`"${filetype.object_constructor.name}" does not implement load`);
                }

                // Actually perform the load operation
                filetype.object_constructor.load(
                    partial_workspace,
                    relative_path,
                    loaded_item => {
                        loaded_objects.push(loaded_item);
                        done();
                    });
            }, () => {
                if (filetype.on_all_loaded) {
                    // Trigger final preparation (e.g. Tags
                    // creating containment hierarchy)
                    const all_of_filetype =
                        loaded_objects.filter(item => item instanceof filetype);
                    filetype.on_all_loaded(all_of_filetype, finished_filetype);
                } else {
                    finished_filetype()
                }
            });
        }, () => { callback(loaded_objects); });
    }

    static get defaults() {
        return DEFAULTS;
    }
}

// Default filetypes to bootstrap creation
const DEFAULTS = [
    new Filetype(get_mod('document.Document')),
    new Filetype(get_mod('document.Tag')),
    new Filetype(get_mod('style.Structure')),
    // new Filetype(get_mod('style.Style')),
    // new FileType(get_mod('media.Image')),
];

module.exports = Filetype;
