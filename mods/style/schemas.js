'use strict';

const Types = require('schemaconf').Types;
const objectmatcher = require('../../lib/objectmatcher').schema_type;

module.exports.style = {
    "style": {
        singular: true,
        required: true,
        values: {
            name: true,
            target: true,
            hierarchy: true,
        },
    },

    "template": {
        required: true,
        singular: false,
        values: {
            match: {
                required: true,
                type: objectmatcher,
            },
            //target:   false, // defaults to "any"
            open:     false, // defaults to opening of tag export-style
            //child:    false, // defaults to {{ child }}, for generic children
            close:    false, // defaults to closing of tag export-style
            template: false,
        },

        multiple: {
            // Represents tags, e.g. _para = <p></p>
            children: {
                prefix: "_",
                type: Types.string,
            },
            // Represents positional, e.g. $first = <p class="dropcaps"></p>
            positional: {
                prefix: "$",
                type: Types.string,
            },
            // or maybe:  _para:first = <p></p> ?
        },
    },
};

module.exports.structure = {
    "structure": {
        // Creates "structure classes". For example, for novel, they are:
        // _frontmatter = prologue forward introduction
        // _bodymatter  = chapter book part
        // _backmatter  = afterward epilogue appendix
        // _top_level   = forward afterward epilogue appendix introduction book part
        // _mid_level   = class:header
        // _bot_level   = class:text
        //
        // Predefined shorthand for hierarchy, which will automatically attempt
        // to match from top down for every node:
        // h1   = forward afterward epilogue appendix introduction book part
        // h2   = class:header
        // h3   = *
        //
        // Similarly, for order:
        // o1   = forward afterward epilogue appendix introduction book part
        // o2   = class:header
        // o3   = *

        singular: true,
        required: true,
        values: {},

        multiple: {
            classes: {
                prefix: "_",
                type: objectmatcher,
            },
            hierarchy: {
                prefix: "h",
                type: objectmatcher,
            },
            ordering: {
                prefix: "o",
                type: objectmatcher,
            },
        },
    },
};
