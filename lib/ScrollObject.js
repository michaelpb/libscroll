'use strict';

const path = require('path');
const schemaconf = require('schemaconf');

class ScrollObject {
    get typename() {
        return this.constructor.name.toLowerCase();
    }

    get name() {
        return this.info && this.info._name;
    }

    get namespace() {
        return this.info && this.info._namespace;
    }

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
            const namespace = file_name.split('_')[0];
            const name = file_name.split('_')[1];

            // Attach these guys
            data_validated._name = name;
            data_validated._namespace = namespace;

            // Create new obj based on validated data
            const obj = new constructor(data_validated);
            callback(obj);
        });
    }
}

module.exports = ScrollObject;
