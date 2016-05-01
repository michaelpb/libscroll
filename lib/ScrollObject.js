'use strict';

const path = require('path');
const schemaconf = require('schemaconf');

const ScrollObjectActions = require('./ScrollObjectActions');

const DEFAULT_NAMESPACE = 'default';

const SCROLL_OBJECT_TYPE = {
    BINARY: Symbol('binary'),
    TEXT: Symbol('text'),
    CONF: Symbol('conf'),
};

// const TMP_TAG_DATA =[];//XXX

// TODO: Everything here needs to be rewritten / re-structured to be based on
// the three Object Types, providing a more powerful base class that does more,
// and subclasses that only need to fit into one of those categories.

class ScrollObject {
    constructor(info = {}, meta = {}) {
        this.info = info;
        this.meta = meta;
    }

    static new_from_binary(constructor, workspace, relpath, callback) {
        // Same as new_from_cfg, except doesn't read
        // TODO: refactor these two into each other
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

    static new_from_cfg(constructor, workspace, relpath, callback,
            parse_contents = false) {
        const schema = constructor.confschema;
        workspace.read(relpath, data_bytes => {
            let data_parsed;
            // Parse it, validate it, and apply defaults
            if (parse_contents) {
                data_parsed = parse_contents(data_bytes);
            } else {
                data_parsed = schemaconf.parse(data_bytes.toString());
            }
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
        let data = new_content;
        if (scrollobj.scrollobj_data_type === SCROLL_OBJECT_TYPE.CONF) {
            const data_parsed = schemaconf.parse(new_content.toString());
            data = schema.validate(data_parsed);
            schema.apply_defaults(data);
        } else if (constructor.parse_contents) {
            data = constructor.parse_contents(data);
        }

        // hacky, attach these guys
        const meta = scrollobj.meta;
        meta.contents = new_content;

        const obj = new constructor(data, meta);
        obj.workspace = scrollobj.workspace;
        return obj;
    }

    get scrollobj_data_type() {
        switch (path.extname(this.path).toLowerCase()) {
            case '.md':
            case '.xml':
            case '.rst':
                return SCROLL_OBJECT_TYPE.TEXT;
            case '.cfg':
            case '.conf':
                return SCROLL_OBJECT_TYPE.CONF;
            default:
                return SCROLL_OBJECT_TYPE.BINARY;
        }
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

    static get DATA_TYPES() {
        return SCROLL_OBJECT_TYPE;
    }
}

module.exports = ScrollObject;
