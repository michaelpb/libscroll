const {Types} = require('schemaconf');

module.exports.tag = {
    "tag": {
        singular: true,
        required: true,
        values: {
            name: true,
            "class": {
                type: Types.wordlist,
                required: false, 
                default: [], 
            },
        },
    },

    "symbol": {
        singular: true,
        required: false,
        values: {
            tag: true,
            tag_re: false,
        },
    },

    "markdown": {
        singular: true,
        required: false,
        values: {
            markdown: false,
            block_default: {
                type: Types.bool,
                default: false,
                required: false, 
            },
            block_prefix: false,
            block_suffix: false,
            contains: {
                type: Types.wordlist,
                default: [],
                required: false, 
            },
            type: {
                type: Types.choice,
                choices: 'inline block',
                required: false, 
                default: "inline", 
            },
        }
    },

    "editor": {
        singular: true,
        required: false,
        values: {
            short_label: false,
            keycode: false,
        },
    },

    "style": {
        singular: false,
        required: true, // need at least one
        values: {
            target: {
                type: Types.wordlist,
                required: true, 
            },
            html: false,
            css: false,
        },
    },

    "processor": {
        singular: false,
        required: false,
        values: {
            name: true,
            // For now, no targetting for processors
            target: {
                type: Types.wordlist,
                required: false, 
            },
            options: false,
        },
    },
};

module.exports.document = {
    "document": {
        singular: true,
        required: true,
        values: {
            contents: true,
        },
    },
};
