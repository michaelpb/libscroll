'use strict';

const path = require('path');
const schemaconf = require('schemaconf');

const ScrollObjectActions = require('./ScrollObjectActions');

const DEFAULT_NAMESPACE = 'default';

// const TMP_TAG_DATA =[];//XXX

class ScrollObject {
    constructor(info = {}, meta = {}) {
        this.info = info;
        this.meta = meta;
    }

    static new_from_binary(constructor, workspace, relpath, callback) {
        // Same as new_from_cfg, except doesn't read
        const file_name = path.parse(relpath).name;
        const split_name = file_name.split('_');
        let namespace;
        let name;

        if (split_name.length < 2) {
            namespace = DEFAULT_NAMESPACE;
            name = file_name;
        } else  {
            namespace = split_name[0];
            name = split_name.slice(1).join('_');
        }

        // hacky, attach these guys
        const fullpath = path.join(workspace.base_path, relpath);
        const meta = {
            name: name,
            namespace: namespace,
            path: relpath,
            contents: null,
            fullpath: fullpath,
            workspace: workspace,
        };

        // Create new obj based on validated data
        const obj = new constructor(null, meta);
        callback(obj);
    }

    static new_from_cfg(constructor, workspace, relpath, callback) {
        const schema = constructor.confschema;
        workspace.read(relpath, data_bytes => {
            // Parse it, validate it, and apply defaults
            const data_parsed = schemaconf.parse(data_bytes.toString());
            const data_validated = schema.validate(data_parsed);
            schema.apply_defaults(data_validated);

            const file_name = path.parse(relpath).name;
            const split_name = file_name.split('_');
            let namespace;
            let name;

            if (split_name.length < 2) {
                namespace = DEFAULT_NAMESPACE;
                name = file_name;
            } else  {
                namespace = split_name[0];
                name = split_name.slice(1).join('_');
            }

            // hacky, attach these guys
            data_validated._name = name;
            data_validated._namespace = namespace;
            const fullpath = path.join(workspace.base_path, relpath);
            const meta = {
                name: name,
                namespace: namespace,
                path: relpath,
                contents: data_bytes.toString(),
                fullpath: fullpath,
                workspace: workspace,
            };

            // Create new obj based on validated data
            /*TMP_TAG_DATA.push(data_validated);
            console.log(`- ${name} -----------------`);
            console.log(JSON.stringify(TMP_TAG_DATA, null, 4));
            console.log(`------------------`);*/
            const obj = new constructor(data_validated, meta);
            callback(obj);
        });
    }

    static reload(scrollobj, new_content) {
        // Parse it, validate it, and apply defaults
        const constructor = scrollobj.constructor;
        const schema = constructor.confschema;
        const data_parsed = schemaconf.parse(new_content.toString());
        const data_validated = schema.validate(data_parsed);
        schema.apply_defaults(data_validated);

        // hacky, attach these guys
        const meta = scrollobj.meta;

        const obj = new constructor(data_validated, meta);
        obj.workspace = scrollobj.workspace;
        return obj;
    }

    get typename() {
        return this.constructor.name.toLowerCase();
    }

    get path() {
        return this.meta.path;
    }

    get fullpath() {
        return this.meta.fullpath;
    }

    get name() {
        return this.meta.name;
    }

    get namespace() {
        return this.meta.namespace;
    }

    get fullname() {
        return `${this.namespace}_${this.name}`;
    }

    get classnames() {
        return this.info && this.info[this.typename]
            && this.info[this.typename]['class'];
    }

    get actions() {
        return new ScrollObjectActions(this, this._actions || {});
    }
}

module.exports = ScrollObject;
