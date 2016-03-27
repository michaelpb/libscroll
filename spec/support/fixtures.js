'use strict';

const ScrollWorkspace = require('../../mods/workspace/ScrollWorkspace');
const Document = require('../../mods/document/Document');
const Tag = require('../../mods/document/Tag');

const TEXT = [
    "para 1 some -- sy < mb >ols",
    "",
    "para 2",
    "continued nested *inline u{stuff} to see*",
    "",
    "## section",
    "",
    "para 3",
].join("\n");

const TAGS = [
    {
        "tag": {"name": "Blockquote", "class": ["text"] },
        "markdown": {
            "contains": ["text"],
            "type": "block",
            "block_default": false
        },
        "editor": { "short_label": "&ldquo; &rdquo;" },
        "style": [
            {
                "target": [ "editor" ],
                "html": "<blockquote>{% contents %}</blockquote>",
                "css": "TAG { display: block; background: gray; }"
            }
        ],
        "symbol": {},
        "_name": "blockquote",
        "_namespace": "default"
    },
    {
        "tag": { "name": "Emdash", "class": [ "style", "simplestyle" ] },
        "symbol": { "tag": "--" },
        "style": [
            {
                "target": [ "default", "editor", "html" ],
                "html": "&mdash;"
            }
        ],
        "markdown": {
            "block_default": false,
            "contains": [],
            "type": "inline"
        },
        "editor": {},
        "_name": "emdash",
        "_namespace": "default"
    },
    {
        "tag": { "name": "Emphasis", "class": [ "style", "simplestyle" ] },
        "markdown": {
            "markdown": "u{$}",
            "contains": [
                "style"
            ],
            "block_default": false,
            "type": "inline"
        },
        "editor": {
            "short_label": "<em>Em</em>",
            "keycode": "i"
        },
        "style": [
            {
                "target": [ "editor" ],
                "css": "    /* some comment */\n    {\n        text-variation: italic;\n    }"
            }
        ],
        "symbol": {},
        "_name": "emphasis",
        "_namespace": "default"
    },
    {
        "tag": {
            "name": "Para",
            "class": [ "text" ]
        },
        "markdown": {
            "block_default": true,
            "contains": [
                "style"
            ],
            "type": "block"
        },
        "editor": {
            "short_label": "&#182;"
        },
        "style": [
            {
                "target": [ "editor" ],
                "css": "    TAG {\n        display: block;\n        padding: 3px;\n    }\n\n    TAG > bk {\n        display: inline;\n    }\n\n    /* something sneaky  */\n    html {\n        display: none;\n    }"
            },
            {
                "target": [ "exported", "ebook", "html", "web" ],
                "html": "<p>{% contents %}</p>",
                "css": ""
            }
        ],
        "symbol": {},
        "_name": "para",
        "_namespace": "default"
    },
    {
        "tag": { "name": "Section", "class": [ "header" ] },
        "markdown": {
            "block_prefix": "##",
            "contains": [
                "simplestyle"
            ],
            "type": "block",
            "block_default": false
        },
        "editor": {
            "short_label": "S"
        },
        "style": [
            {
                "target": [ "editor" ],
                "html": "<h1>{% contents %}</h1>",
                "css": "TAG { display: block; font-size: 24pt; }"
            },
            {
                "target": [ "editmode" ],
                "html": "    <button>Clear section</button>\n    <textarea>{{ code }}</textarea>\n    <p>Preview:</p>\n    <h1>{% contents %}</h1>"
            }
        ],
        "symbol": {},
        "_name": "section",
        "_namespace": "default"
    },
    {
        "tag": { "name": "Strong", "class": [ "style" ] },
        "markdown": {
            "markdown": "*$*",
            "contains": [
                "style"
            ],
            "block_default": false,
            "type": "inline"
        },
        "editor": {
            "short_label": "<strong>Str</strong>",
            "keycode": "b"
        },
        "style": [
            {
                "target": [ "editor" ],
                "css": "{ display: block; font-weight: bold; }"
            }
        ],
        "symbol": {},
        "_name": "strong",
        "_namespace": "default"
    },
    {
        "tag": { "name": "KaTeX inline formula", "class": [ "style" ] },
        "markdown": {
            "open": "$",
            "close": "$",
            "contains": [],
            "block_default": false,
            "type": "inline"
        },
        "processor": [{
            "name": "katex",
            "options": {
                "katex": [{
                    "display_mode": "true",
                }]
            }
        }],
        "style": [{
            "target": ["editor"],
        }],
        "symbol": {},
        "_name": "formula",
        "_namespace": "math"
    }
];

// while TAGS is more typical, TAGS PARSING is for more tricky parsing situations
const TAGS_PARSING = [
    {
        "tag": { "name": "Para", "class": [ "text" ] },
        "markdown": {
            "block_default": true,
            "contains": ["style"],
            "type": "block"
        },
        "symbol": {},
        "_name": "para",
    },
    {
        "tag": { "name": "Section", "class": [ "header" ] },
        "markdown": {
            "block_prefix": "##",
            "contains": ["simplestyle"],
            "type": "block",
            "block_default": false
        },
        "symbol": {},
        "_name": "section",
    },
    {
        "tag": { "name": "Sub-section", "class": [ "header" ] },
        "markdown": {
            "block_prefix": "###",
            "contains": ["simplestyle"],
            "type": "block",
            "block_default": false
        },
        "symbol": {},
        "_name": "subsection",
    },
    {
        "tag": { "name": "Strong", "class": [ "style" ] },
        "markdown": {
            "markdown": "*$*",
            "contains": [ "style" ],
            "block_default": false,
            "type": "inline"
        },
        "symbol": {},
        "_name": "strong",
    },
];

function make_document(workspace) {
    const new_doc = new Document({document: {contents: TEXT}});
    new_doc.workspace = workspace;
    return new_doc;
}

function make_tags() {
    return TAGS.map(info =>
        new Tag(info, {
            name: info._name,
            namespace: info._namespace,
            path: `tag/${info._name}.cfg`,
        }));
}

function make_tags_parsing() {
    return TAGS_PARSING.map(info =>
        new Tag(info, {
            name: info._name,
            namespace: "default",
            path: `tag/${info._name}.cfg`,
        }));
}

function make_workspace() {
    const tags = make_tags();
    const partial_workspace = new ScrollWorkspace('', tags);
    const workspace = new ScrollWorkspace('', [
        ...tags,
        make_document(partial_workspace),
    ]);
    return workspace;
}

module.exports.make_workspace = make_workspace;
module.exports.make_tags_parsing = make_tags_parsing;
module.exports.make_tags = make_tags;
