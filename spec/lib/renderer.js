'use strict';
const helpers = require('../support/helpers');

describe('EditorRenderer', () => {
    let parser;
    let renderer;
    const set_vars = done => (loaded_p, loaded_r) => {
        parser = loaded_p;
        renderer = loaded_r;
        done();
    };

    afterEach(() => {
        parser = null;
        renderer = null;
    });

    describe('with custom HTML disabled', () => {
        beforeEach((done) => {
            helpers.load_edit_renderer({disable_custom_html: true}, set_vars(done));
        });

        it('renders typical markdown document', (done) => {
            const text = [
                "para 1 some -- sy < mb >ols",
                "",
                "para 2",
                "continued nested *inline u{stuff} to see*",
                "",
                "## section",
                "",
                "para 3",
            ].join("\n");

            const expected = ['<bk class="', 'default_para', '" data="',
                'para 1 some -- sy < mb >ols', '">',
                'para 1 some &mdash; sy &lt; mb &gt;ols', '</bk>', '<bk class="',
                'default_para', '" data="',
                'para 2 continued nested *inline u{stuff} to see*',
                '">', 'para 2\ncontinued nested ', '<in class="', 'default_strong',
                '">', 'inline ', '<in class="', 'default_emphasis', '">', 'stuff',
                '</in>', ' to see', '</in>', '</bk>', '<bk class="',
                'default_section', '" data="', '## section', '">', ' section',
                '</bk>', '<bk class="', 'default_para', '" data="', 'para 3',
                '">', 'para 3', '</bk>',].join('')

            renderer.render_to_string(text, parser, result => {
                expect(result).toEqual(expected);
                done();
            });
        });
    });

    describe('with only paragraph elements', () => {
        beforeEach((done) => {
            helpers.load_edit_renderer({ONLY_DO_PARA: true}, set_vars(done));
        });

        it('renders markdown document', (done) => {
            const text = [
                "para 1 some -- sy < mb >ols",
                "",
                "para 2",
                "continued nested *inline u{stuff} to see*",
                "",
                "## section",
                "",
                "para 3",
            ].join("\n");

            const expected = [
                '<bk class="default_para', '" data="',
                'para 1 some -- sy < mb >ols', '">',
                'para 1 some -- sy &lt; mb &gt;ols', '</bk>',
                '<bk class="default_para', '" data="',
                'para 2 continued nested *inline u{stuff} to see*', '">',
                'para 2\ncontinued nested *inline u{stuff} to see*', '</bk>',
                '<bk class="default_para', '" data="', '## section', '">',
                '## section', '</bk>', '<bk class="default_para',
                '" data="', 'para 3', '">', 'para 3', '</bk>',
            ].join('');

            renderer.render_to_string(text, parser, result => {
                expect(result).toEqual(expected);
                done();
            });
        });
    });

    describe('allowing custom HTML', () => {
        beforeEach((done) => {
            helpers.load_edit_renderer({}, set_vars(done));
        });

        it('renders a markdown document', (done) => {
            const text = [
                "para 1 some -- sy < mb >ols",
                "",
                "para 2",
                "continued nested *inline u{stuff} to see*",
                "",
                "## section",
                "",
                "para 3",
            ].join("\n");

            const expected = [
                '<bk class="default_para" data="para 1 some -- sy < mb >ols">',
                'para 1 some &mdash; sy &lt; mb &gt;ols</bk>',
                '<bk class="default_para" data="para 2 continued nested *inline u{stuff} to see*">',
                'para 2\ncontinued nested <in class="default_strong">',
                'inline <in class="default_emphasis">',
                'stuff</in> ', 'to see</in>', '</bk>',
                '<bk class="default_section" data="## section">', '<h1>', ' section</h1>', '</bk>',
                '<bk class="default_para" data="para 3">', 'para 3</bk>',].join("");

            renderer.render_to_string(text, parser, result => {
                expect(result).toEqual(expected);
                done();
            });
        });
    });
});
