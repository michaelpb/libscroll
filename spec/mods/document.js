'use strict';
const Document = require('../../mods/document/Document');
const Tag = require('../../mods/document/Tag');
const helpers = require('../support/helpers');
const fixtures = require('../support/fixtures');

const normalize = s => s.split(".").sort().join(".");
const EXPECTED_CSS = normalize([
    '.default_blockquote { display: block; background: gray;} ',
    '.default_emphasis { text-variation: italic;} ',
    '.default_para { display: block; padding: 3px;} ',
    '.default_para > bk { display: inline;} ',
    '.default_para html { display: none;} ', // check prevents breakage
    '.default_section { display: block; font-size: 24pt;} ',
    '.default_strong { display: block; font-weight: bold;} '].join(''));

describe('Document', () => {
    it('instantiates', () => {
        const doc = new Document({document: {contents: 'test stuff'}});
        expect(doc.contents).toEqual('test stuff');
    });

    it('actions rendering to default works', () => {
        const workspace = fixtures.make_workspace();
        const doc = workspace.objects.document[0];
        const EXPECTED = [
            '<div class="default_para">para 1 some ',
            '&mdash; sy &lt; mb &gt;ols</div><div class="default_para">para 2\n',
            'continued nested <span class="default_strong">inline ',
            '<span class="default_emphasis">stuff</span> to see</span></div><h1> ',
            'section</h1><div class="default_para">para 3</div>',
        ].join('');
        expect(doc.actions.render()).toEqual(EXPECTED);
    });

    it('actions rendering CSS to default works', () => {
        const workspace = fixtures.make_workspace();
        const doc = workspace.objects.document[0];
        expect(normalize(doc.actions.rendercss())).toEqual(EXPECTED_CSS);
    });

    it('actions rendering to editor HTML works', () => {
        const workspace = fixtures.make_workspace();
        const doc = workspace.objects.document[0];

        const EXPECTED = [
            '<bk class="default_para" data="para 1 some -- sy < mb >ols">',
            'para 1 some &mdash; sy &lt; mb &gt;ols</bk>',
            '<bk class="default_para" data="para 2 continued nested *inline u{stuff} to see*">',
            'para 2\ncontinued nested <in class="default_strong">',
            'inline <in class="default_emphasis">',
            'stuff</in> ', 'to see</in>', '</bk>',
            '<bk class="default_section" data="## section">', '<h1>', ' section</h1>', '</bk>',
            '<bk class="default_para" data="para 3">', 'para 3</bk>',
        ].join('');

        expect(doc.actions.render('editor')).toEqual(EXPECTED);
    });
});

describe('Tag', () => {
    describe('while loading from files', () => {
        let tags;
        beforeEach((done) => {
            helpers.load_tags(loaded_tags => {
                tags = loaded_tags;
                done();
            });
        });

        it('has expected properties', () => {
            expect(tags.every(tag => tag.containment)).toEqual(true);
        });

        it('renders combined CSS', () => {
            expect(normalize(EXPECTED_CSS))
                .toEqual(normalize(Tag.render_css(tags)));
        });
    });

    it('renders with tag processors', () => {
        const workspace = fixtures.make_workspace();
        const tag = workspace.objects.get('formula');
        expect(tag).toBeTruthy();

        // Ensure tag processor has correct settings
        const processors = tag._get_processors('default');
        expect(processors.length).toEqual(1);
        expect(processors[0].opts).toEqual({
            displayMode: true, // block
            throwOnError: false,
        });

        // Check actual processor now
        const processor = tag.get_processor('default');
        expect(processor).toBeTruthy();
        const result = processor('\\sqrt{f}');
        expect(result).toMatch(/^\s*<span class="katex-display">/);
        expect(result).toMatch(/span>$/);
        expect(result).toContain('√');
    });
});
