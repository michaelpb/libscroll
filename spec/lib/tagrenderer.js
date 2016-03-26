'use strict';
const MathJaxTagRenderer = require('../../lib/tagrenderer/mathjax');
const KatexTagRenderer = require('../../lib/tagrenderer/katex');
const HighlightRenderer = require('../../lib/tagrenderer/highlight');
const TreeNode = require('../../lib/parser/TreeNode');
const helpers = require('../support/helpers');
const fixtures = require('../support/fixtures');

// permanently disable, so it doesnt even show up:
const skipped_it = () => {};

describe('TagRenderer', () => {
    describe('MathJax Renderer', () => {
        let originalTimeout;
        beforeEach(() => {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            // 10 second timeout since this is a really slow test
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        });

        afterEach(() => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        skipped_it('renders a basic LaTeX formula', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const mjr = new MathJaxTagRenderer(tag);
            const outer_tag = new TreeNode(tag, null);
            const inner_text = new TreeNode('\\sqrt{f}');
            outer_tag.children.push(inner_text);

            mjr.render(outer_tag, result => {
                expect(result).toMatch(/^\s*<svg/);
                expect(result).toMatch(/svg>$/);
                expect(result).toMatch(/\<path stroke-width/);
                expect(result).toMatch(/width="3.142ex"/);
                expect(result).toMatch(/height="3.509ex"/);
                done();
            });
        });
    });

    describe('Highlight.js Renderer', () => {
        it('renders simple HTML higlighting', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const hlr = new HighlightRenderer(tag);
            const EXAMPLE_HTML = [
                '<!DOCTYPE html>',
                '<title>Title</title>',
                '<style>body {width: 500px;}</style>',
                '<body><p checked class="title" id="title">Title</p></body>',
            ].join('\n');
            const EXPECTED = [
                '&lt;!DOCTYPE html>',
                '&lt;title>Title&lt;/title>',
                '&lt;style>body {width: <span class="number">500</span>px;}&lt;/style>',
                '&lt;body>&lt;p checked <span class="keyword">class</span>=<span class="string">"title"</span> id=<span class="string">"title"</span>>Title&lt;/p>&lt;/body>',
            ].join('\n');
            const inner_text = new TreeNode(EXAMPLE_HTML);
            const outer_tag = new TreeNode(tag, null);
            outer_tag.children.push(inner_text);

            hlr.render(outer_tag, result => {
                expect(result).toEqual(EXPECTED);
                done();
            });
        });
    });

    describe('KaTeX Renderer', () => {
        it('renders a basic LaTeX formula', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const mjr = new KatexTagRenderer(tag);
            const outer_tag = new TreeNode(tag, null);
            const inner_text = new TreeNode('\\sqrt{f}');
            outer_tag.children.push(inner_text);

            mjr.render(outer_tag, result => {
                expect(result).toMatch(/^\s*<span class="katex">/);
                expect(result).toMatch(/span>$/);
                expect(result).toContain('√');
                done();
            });
        });
    });
});
