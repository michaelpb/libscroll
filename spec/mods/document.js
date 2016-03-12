'use strict';
const Document = require('../../mods/document/Document');
const Tag = require('../../mods/document/Tag');
const helpers = require('../support/helpers');

describe('Document', () => {
    function new_doc(text) {
        return new Document({document: {contents: 'test stuff'}});
    }
    fit('instantiates', () => {
        expect(new_doc(contents).contents).toEqual('test stuff');
    });

    fit('rendering to editor HTML works', () => {
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

        const EXPECTED = [
            '<bk class="default_para" data="para 1 some -- sy < mb >ols">',
            'para 1 some &mdash; sy &lt; mb &gt;ols</bk>',
            '<bk class="default_para" data="para 2 continued nested *inline u{stuff} to see*">',
            'para 2\ncontinued nested <in class="default_strong">',
            'inline <in class="default_emphasis">',
            'stuff</in> ', 'to see</in>', '</bk>',
            '<bk class="default_section" data="## section">', '<h1>', ' section</h1>', '</bk>',
            '<bk class="default_para" data="para 3">', 'para 3</bk>',].join("");
        const doc = new Document(TEXT);
    });
});

describe('Tag', () => {
    describe('when several are loaded', () => {
        let tags;
        beforeEach((done) => {
            helpers.load_tags(loaded_tags => {
                tags = loaded_tags;
                done();
            });
        });

        const expected_css = [
            '.default_blockquote { display: block; background: gray;} ',
            '.default_emphasis { text-variation: italic;} ',
            '.default_para { display: block; padding: 3px;} ',
            '.default_para > bk { display: inline;} ',
            '.default_para html { display: none;} ',
            '.default_section { display: block; font-size: 24pt;} ',
            '.default_strong { display: block; font-weight: bold;} '].join('');

        it('renders combined CSS', () => {
            const normalize = s => s.split(".").sort().join(".");
            expect(normalize(expected_css))
                .toEqual(normalize(Tag.render_css(tags)));
        });
    });
});
