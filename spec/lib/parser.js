'use strict';
const helpers = require('../support/helpers');

const REV = {
    1: "TEXT",
    2: "TAG",
    3: "OPEN_TAG",
    4: "CLOSE_TAG",
    5: "NODE_ENTER",
    6: "NODE_EXIT",
    7: "NODE",
};

describe('ScrollMarkdownParser', () => {
    let parser;

    beforeEach((done) => {
        helpers.load_parser(loaded_parser => {
            parser = loaded_parser;
            done();
        });
    });

    afterEach(() => {
        parser = null;
    });

    it('should trim whitespace', (done) => {
        // the parser should trim whitespace by default
        const text = [
            "",
            "## section",
            "",
            "   a paragraph  ",
            "",
        ].join("\n");
        const result = [
            ["OPEN_TAG", "section"],
                ["TEXT", " section"],
            ["CLOSE_TAG", "section"],
            ["OPEN_TAG", "para"],
                ["TEXT", "a paragraph"],
            ["CLOSE_TAG", "para"],
        ];

        const contents = [];
        parser.parse(text, (type, tag, value) => {
            contents.push([REV[type], tag ? tag.name : value]);
        }, () => {
            expect(result).toEqual(contents);
            done();
        });
    });

    it('parses more complicated document', (done) => {
        // more complicated example
        const text = [
            "## section",
            "",
            "para 1 some -- sy < mb >ols",
            "",
            "para 2",
            "continued nested *inline u{stuff} to see*",
            "",
            "## section",
            "",
            "para 3",
        ].join("\n");

        const result = [
            ["OPEN_TAG", "section"],
                ["TEXT", " section"],
            ["CLOSE_TAG", "section"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 1 some "],
                    ["OPEN_TAG", "emdash"],
                    ["CLOSE_TAG", "emdash"],
                ["TEXT", " sy < mb >ols"],
            ["CLOSE_TAG", "para"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 2\ncontinued nested "],
                    ["OPEN_TAG", "strong"],
                        ["TEXT", "inline "],
                        ["OPEN_TAG", "emphasis"],
                            ["TEXT", "stuff"],
                        ["CLOSE_TAG", "emphasis"],
                        ["TEXT", " to see"],
                    ["CLOSE_TAG", "strong"],
            ["CLOSE_TAG", "para"],
            ["OPEN_TAG", "section"],
                ["TEXT", " section"],
            ["CLOSE_TAG", "section"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 3"],
            ["CLOSE_TAG", "para"],
        ];

        const contents = [];
        parser.parse(text, function (type, tag, value) {
            contents.push([REV[type], tag ? tag.name : value]);
        }, function () {
            expect(result).toEqual(contents);
            done();
        });
    });

    it('parses XML style tags', (done) => {
        // more complicated example with XML style tags
        const text = [
            "<section>",
            " section",
            "</section><default_para>",
            "para 1 some -- sy < mb >ols",
            "</default_para>"+
            "para 2",
            "continued nested "+
            "<strong>",
            "inline "+
            "<emphasis>",
            "stuff",
            "</emphasis> to see",
            "</strong>",
            "",
            "## section",
            "",
            "para 3",
        ].join("\n");

        const result = [
            ["OPEN_TAG", "section"],
                ["TEXT", " section"],
            ["CLOSE_TAG", "section"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 1 some "],
                    ["OPEN_TAG", "emdash"],
                    ["CLOSE_TAG", "emdash"],
                ["TEXT", " sy < mb >ols"],
            ["CLOSE_TAG", "para"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 2\ncontinued nested "],
                    ["OPEN_TAG", "strong"],
                        ["TEXT", "inline "],
                        ["OPEN_TAG", "emphasis"],
                            ["TEXT", "stuff"],
                        ["CLOSE_TAG", "emphasis"],
                        ["TEXT", " to see"],
                    ["CLOSE_TAG", "strong"],
            ["CLOSE_TAG", "para"],
            ["OPEN_TAG", "section"],
                ["TEXT", " section"],
            ["CLOSE_TAG", "section"],
            ["OPEN_TAG", "para"],
                ["TEXT", "para 3"],
            ["CLOSE_TAG", "para"],
        ];

        const contents = [];
        parser.parse(text, (type, tag, value) => {
            contents.push([REV[type], tag ? tag.name : value]);
        }, () => {
            //helpers.tokens_side_by_side(result, contents);
            expect(result).toEqual(contents);
            done();
        });
    });
});


const TEXT = [
    'p0',
    // dont have have 2 newlines after blockquote, to prevent extraneous newlines
    '<default_blockquote>\na quote\n</default_blockquote>p1',
    '## doc',
        'p2',
        'some *formatted* text',
].join("\n\n");

const EXPECTED_RESULTS = [
    [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p0' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
    [ 'NODE_ENTER', 'blockquote' ],
        [ 'OPEN_TAG', 'blockquote' ],
            [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'a quote' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
        [ 'CLOSE_TAG', 'blockquote' ],
        [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p1' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
    [ 'NODE_EXIT', 'blockquote' ],
    [ 'NODE_ENTER', 'section' ],
        [ 'OPEN_TAG', 'section' ], [ 'TEXT', ' doc' ], [ 'CLOSE_TAG', 'section' ],
        [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p2' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
        [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'some ' ],
            [ 'NODE_ENTER', 'strong' ], [ 'OPEN_TAG', 'strong' ], [ 'TEXT', 'formatted' ], [ 'CLOSE_TAG', 'strong' ], [ 'NODE_EXIT', 'strong' ],
            [ 'TEXT', ' text' ],
        [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
    [ 'NODE_EXIT', 'section' ],
];

const TEXT_2 = [
    '## doc',
        'p4',
        // dont have full two newlines after blockquote, to prevent extraneous newlines
        '<default_blockquote>\n\n</default_blockquote>p5',
            'p6',
    ].join("\n\n");

const EXPECTED_RESULTS_2 = [
    [ 'NODE_ENTER', 'section' ],
        [ 'OPEN_TAG', 'section' ], [ 'TEXT', ' doc' ], [ 'CLOSE_TAG', 'section' ],
        [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p4' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
        [ 'NODE_ENTER', 'blockquote' ],
            [ 'OPEN_TAG', 'blockquote' ], [ 'CLOSE_TAG', 'blockquote' ],
            [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p5' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
            [ 'NODE_ENTER', 'para' ], [ 'OPEN_TAG', 'para' ], [ 'TEXT', 'p6' ], [ 'CLOSE_TAG', 'para' ], [ 'NODE_EXIT', 'para' ],
        [ 'NODE_EXIT', 'blockquote' ],
    [ 'NODE_EXIT', 'section' ]
];

describe('StructuredParser', () => {
    let parser;
    let contents;
    beforeEach((done) => {
        contents = [];
        helpers.load_structure_parser(loaded_parser => {
            parser = loaded_parser;
            done();
        });
    });

    afterEach(() => {
        parser = null;
        contents = null;
    });

    const push = (type, tag, value) =>
        contents.push([REV[type], tag ? tag.name : value]);

    it('parses markdown as expected', (done) => {
        parser.parse(TEXT, push, () => {
            //helpers.tokens_side_by_side(EXPECTED_RESULTS, contents);
            expect(contents).toEqual(EXPECTED_RESULTS);
            done();
        });
    });

    it('handles nested block structures', (done) => {
        parser.parse(TEXT_2, push, () => {
            expect(contents).toEqual(EXPECTED_RESULTS_2);
            // helpers.tokens_side_by_side(EXPECTED_RESULTS_2, contents);
            done();
        });
    });

    it('parsers longer document', (done) => {
        const text = [TEXT, TEXT_2].join("\n\n");
        const expected_results = EXPECTED_RESULTS.concat(EXPECTED_RESULTS_2);
        parser.parse(text, push, () => {
            expect(contents).toEqual(expected_results);
            // helpers.tokens_side_by_side(expected_results, contents);
            done();
        });
    });
});

describe('TreeParser', () => {
    let parser;
    beforeEach((done) => {
        helpers.load_tree_parser(loaded_parser => {
            parser = loaded_parser;
            done();
        });
    });

    afterEach(() => {
        parser = null;
    });

    ////////// TODO more carefully inspect this obj to be correct
    const EXPECTED_TREE = {
        // root
        "is_text": false, "tag": "root", "parent": null, "children": [
            // p0
            { "is_text": false, "tag": "para", "parent": "root", "children": [
                    { "is_text": true, "text": "p0", "parent": "para" } ]
            // blockquote
            }, { "is_text": false, "tag": "blockquote", "parent": "root", "children": [
                // "p1"
                    { "is_text": false, "tag": "para", "parent": "blockquote", "children": [
                            { "is_text": true, "text": "p1", "parent": "para" }
                        ] } ],
                // "a quote"
                "head": [
                    { "is_text": false, "tag": "para", "parent": "blockquote", "children": [
                            { "is_text": true, "text": "a quote", "parent": "para" }
                        ] } ]
            }, { "is_text": false, "tag": "section", "parent": "root", "children": [ {
                        "is_text": false, "tag": "para", "parent": "section",
                        "children": [ { "is_text": true, "text": "p2", "parent": "para" }
                        ]
                    }, { "is_text": false, "tag": "para", "parent": "section", "children": [
                            { "is_text": true, "text": "some ", "parent": "para" },
                            { "is_text": false, "tag": "strong", "parent": "para", "children": [
                                    { "is_text": true, "text": "formatted", "parent": "strong" }
                                ] }, { "is_text": true, "text": " text", "parent": "para" }
                        ] } ],
                "head": [ { "is_text": true, "text": " doc", "parent": "section" } ]
            },
            { "is_text": false, "tag": "section", "parent": "root", "children": [
                    { "is_text": false, "tag": "para", "parent": "section", "children": [
                            { "is_text": true, "text": "p4", "parent": "para" }
                        ]
                    }, { "is_text": false, "tag": "blockquote", "parent": "section", "children": [
                            { "is_text": false, "tag": "para", "parent": "blockquote", "children": [
                                    { "is_text": true, "text": "p5", "parent": "para" }
                                ] },
                            { "is_text": false, "tag": "para", "parent": "blockquote", "children": [
                                    { "is_text": true, "text": "p6", "parent": "para" }
                                ] } ] } ],
                "head": [ { "is_text": true, "text": " doc", "parent": "section" }
                ] } ] };

    it('creates a full parse tree', (done) => {
        const text = [TEXT, TEXT_2].join("\n\n");
        parser.parse(text, () => {}, function (result) {
            helpers.ast_strip_tags(result);
            // TODO for some reason, plain comparisons don't work, only stringify does, wtf
            expect(JSON.stringify(result)).toEqual(JSON.stringify(EXPECTED_TREE));
            done();
        });
    });
});
