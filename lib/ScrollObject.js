'use strict';

const path = require('path');
const schemaconf = require('schemaconf');

const ScrollObjectActions = require('./ScrollObjectActions');

const DEFAULT_NAMESPACE = 'default';

class ScrollObject {
    constructor(info = false) {
        if (typeof info === 'object') {
            this.info = info;
        }
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

            // Create new obj based on validated data
            const obj = new constructor(data_validated);
            callback(obj);
        });
    }

    get typename() {
        return this.constructor.name.toLowerCase();
    }

    get name() {
        return this.info && this.info._name;
    }

    get namespace() {
        return this.info && this.info._namespace;
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
