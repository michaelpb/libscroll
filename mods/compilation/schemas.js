'use strict';

const Types = require('schemaconf').Types;
const objectmatcher = require('../../lib/objectmatcher').schema_type;

module.exports.compilation = {
    compilation: {
        singular: true,
        required: true,
        values: {
            name: true,
            destination: {
                required: false,
                default: 'build',
            },
        },
    },

    /*
    filecompiler: {
        required: false,
        singular: false,
        values: {
            match: {
                required: true,
                type: objectmatcher,
            },
            compiler: true, // Which compiler is used
        },
    },
    */

    /*
    compile: {
        required: false,
        singular: false,
        values: {
            compiler: true, // Which compiler is used
        },
    },
    */
};
