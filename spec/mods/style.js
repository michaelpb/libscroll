'use strict';
const Structure = require('../../mods/style/Structure');
const Style = require('../../mods/style/Style');
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

const EXPECTED_NO_STYLE = [
    '<div class="default_para">', 'p0</div>',
    '<blockquote>', '<div class="default_para">', 'a quote</div>', '</blockquote>',
    '<div class="default_para">', 'p1</div>',
    '<h1>', ' doc</h1>',
    '<div class="default_para">', 'p2</div>',
    '<div class="default_para">', 'some <span class="default_strong">',
        'formatted</span>', ' text</div>',
    '<h1>', ' doc</h1>',
    '<div class="default_para">', 'p4</div>',
    '<blockquote>', '</blockquote>',
    '<div class="default_para">', 'p5</div>',
    '<div class="default_para">', 'p6</div>',].join('')

const STYLE_TEXT = [
    'p0',
    // dont have have 2 newlines after blockquote, to prevent extraneous newlines
    '<default_blockquote>\na quote\n</default_blockquote>p1',
    '## doc',
        'p2',
        'some *formatted* text',
    '## doc',
        'p4',
        // dont have full two newlines after blockquote, to prevent extraneous newlines
        '<default_blockquote>\n\n</default_blockquote>p5',
            'p6',
    ].join("\n\n");

describe('Style', () => {
    it('renders a the empty style as expected', (done) => {
        helpers.load_style_renderer({style: Style.EMPTY_STYLE}, (parser, renderer) => {
            renderer.render_to_string(STYLE_TEXT, parser, result => {
                expect(result).toEqual(EXPECTED_NO_STYLE);
                // helpers.html_diff(EXPECTED_NO_STYLE, result);
                done();
            });
        });
    });
});
