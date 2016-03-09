'use strict';
const Structure = require('../../mods/style/Structure');
const helpers = require('../support/helpers');
const {LEFT_EARLIER, LEFT_HIGHER, EQUAL, RIGHT_EARLIER, RIGHT_HIGHER,
    UNRANKED} = require('../../lib/parser/constants');

describe('Structure', () => {
    describe('when testing loaded tags', () => {
        let st;
        let tags;
        beforeEach((done) => {
            helpers.load_tags((loaded_tags) => {
                tags = loaded_tags;
                helpers.load_structure(
                    {structure_file_name: 'structure.cfg'},
                    (loaded_structure) => {
                        st = loaded_structure;
                        done();
                    }
                );
            });
        });

        afterEach(() => {
            st = null;
            tags = null;
        });

        it('compares hierarchy correctly', () => {
            expect(st).toBeTruthy();
            expect(tags).toBeTruthy();

            // there are 5 test tags
            const para = tags.find(tag => tag.name === 'para');
            const section = tags.find(tag => tag.name === 'section');
            const blockquote = tags.find(tag => tag.name === 'blockquote');
            const emphasis = tags.find(tag => tag.name === 'emphasis');
            const strong = tags.find(tag => tag.name === 'strong');

            expect(st.hierarchy_cmp(section, para)).toEqual(LEFT_HIGHER);
            expect(st.hierarchy_cmp(blockquote, section)).toEqual(RIGHT_HIGHER);
            expect(st.hierarchy_cmp(para, blockquote)).toEqual(EQUAL);
            expect(st.hierarchy_cmp(para, strong)).toEqual(LEFT_HIGHER);
            expect(st.hierarchy_cmp(section, strong)).toEqual(LEFT_HIGHER);
        });
    });
});

//const EMPTY_STYLE = new Style('testing', 'empty', { template: [] });
const trim = string => string.replace(/\s*/g, '');
const EXPECTED_NO_STYLE = [
        '<div class="testing_para">', 'p0</div>',
        '<blockquote>', '<div class="testing_para">', 'a quote</div>', '</blockquote>',
        '<div class="testing_para">', 'p1</div>',
        '<h1>', ' doc</h1>',
        '<div class="testing_para">', 'p2</div>',
        '<div class="testing_para">', 'some <span class="testing_strong">',
            'formatted</span>', ' text</div>',
        '<h1>', ' doc</h1>',
        '<div class="testing_para">', 'p4</div>',
        '<blockquote>', '</blockquote>',
        '<div class="testing_para">', 'p5</div>',
        '<div class="testing_para">', 'p6</div>',].join('')

describe('Style', () => {
    describe('when using an empty style', () => {
        let st;
        let tags;
        beforeEach((done) => {
            helpers.load_tags((loaded_tags) => {
                tags = loaded_tags;
                helpers.load_structure(
                    {structure_file_name: 'structure.cfg'},
                    (loaded_structure) => {
                        st = loaded_structure;
                        done();
                    }
                );
            });
        });

        afterEach(() => {
            st = null;
            tags = null;
        });

        xit('renders as expected', (done) => {
            var opts = { style: EMPTY_STYLE, STRUCTFILENAME: "structure2.cfg" };
            helpers.load_style_renderer(opts, function (parser, renderer) {
                var text = TEXT;
                var expected = EXPECTED_NO_STYLE;
                renderer.render_to_string(text, parser, function (result) {
                    //console.log("THIS IS RESULT", result.split(">").join(">',\n"));
                    expect(expected).toEqual(result);
                    //helpers.html_diff(expected, result);
                    //helpers.pp_html(result);
                    done();
                });
            });
        });
    });
});
