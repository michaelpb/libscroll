'use strict';
const fs = require('fs');

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
        this.name = object_constructor.name.toLowerCase();
        this.dependencies = object_constructor.dependencies;

        if (matcher === null) {
            matcher = new RegExp(`^${this.name}/`, 'i');
        }

        if (matcher instanceof RegExp) {
            const regexp_matcher = matcher;
            matcher = path => regexp_matcher.test(path);
        }

        this.matcher = matcher;
        this.args = args; // <-- TODO: implement
    }

    static load_all(filetypes, paths, partial_workspace_factory, callback) {
        // First, we sort based on dependencies
        const sorter = new TopoSort();
        const filetypes_by_name = {};
        for (const filetype of filetypes) {
            sorter.add(filetype.name, filetype.dependencies);
            filetypes_by_name[filetype.name] = filetype;
        }

        // Recursively load all items on the list
        const sorted_list = sorter.sort();
        const loaded_items = [];
        async.eachSeries(sorted_list, (name, item_callback) => {
            const filetype = filetypes_by_name[name];
            const partial_workspace = partial_workspace_factory(loaded_items);

            // Get relevant paths, and open each file, passing the
            // open file to the loader
            const matched_paths = paths.filter(filetype.matcher);
            async.each(matched_paths, (path, done) => {
                fs.open(path, (error, fd) => {
                    if (error) { throw error; }
                    filetype.object_constructor.load(partial_workspace, fd, loaded_item => {
                        loaded_items.push(loaded_item);
                        done();
                    });
                });
            }, item_callback);
        }, () => { callback(loaded_items); });
    }

    static get defaults() {
        return DEFAULTS;
    }
}

// Default filetypes to bootstrap creation
const DEFAULTS = [
    new Filetype(get_mod('document.Document')),
    // new Filetype(get_mod('document.Tag')),
    // new Filetype(get_mod('style.Structure')),
    // new Filetype(get_mod('style.Style')),
    // new FileType(get_mod('media.Image')),
];

module.exports = Filetype;
