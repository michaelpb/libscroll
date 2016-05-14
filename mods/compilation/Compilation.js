'use strict';

// Pull in style schema
const ScrollObject = require('../../lib/ScrollObject');
const fsutils = require('../../lib/utils/fsutils');
const path = require('path');
const fse = require('fs-extra');
const SCHEMA = require('./schemas').compilation;
const schemaconf = require('schemaconf');
const CONFSCHEMA = new schemaconf.ConfSchema(
    SCHEMA, {'no_exceptions': true});

const TYPES = ScrollObject.DATA_TYPES;

const ACTIONS = {
    compile: function (callback) {
        const tmp_dir = fsutils.get_free_tmp_dir_sync();
        const actions = [];

        // First prepare actions
        for (const object of this.workspace.objects) {
            const action = this.get_action(object);
            if (action === null) {
                continue; // Skip this one, probably CFG
            }
            const resulting_path = path.join(tmp_dir, object.path);
            const curried = callback => action(object, tmp_dir, this, callback);
            actions.push(curried);
        }

        // Then perform in parallel
        async.parallel(actions, () => {
            // Finally perform 'global' actions
            const global_actions = this.get_global_actions(tmp_dir);
            async.series(global_actions, callback);
        });
    },
};

class Compilation extends ScrollObject {
    constructor(...args) {
        super(...args);
        this.destination = this.info.compilation.destination;
    }

    static get confschema() {
        return CONFSCHEMA;
    }

    static get_default_action(object) {
        const datatype = object.scrollobj_data_type;
        const {TEXT, CONF, BINARY} = ScrollObject.DATA_TYPES;
        if (datatype === CONF) {
            return null; // ignore conf files
        }

        if (datatype === BINARY) {
            return Compilation.action_copy;
        }

        // Is a TEXT type, assume we render to HTML
        return Compilation.action_render;
    }

    static action_copy(object, out_path, compilation_settings, callback) {
        fse.copy(object.fullpath, out_path, callback);
    }

    static action_render(object, out_path, compilation_settings, callback) {
        // Replace extension with '.html'
        out_path = `${out_path.substr(0, file.lastIndexOf("."))}.html`;
        const text = object.actions.render();
        fse.writeFile(out_path, text, callback);
    }

    get_action(object) {
        return Compilation.get_default_action(object);
    }

    get_global_actions(tmp_dir) {
        const relpath = this.info.compilation.destination;
        const destination_path = this.workspace.resolve_relpath(relpath);
        // Default case, simply move
        const default_global_action = callback => {
            fse.move(tmp_dir, destination_path, callback);
        };
        return [default_global_action];
    }

    get _actions() {
        return ACTIONS;
    }
}

module.exports = Compilation;
