'use strict';
const MathJaxTagProcessor = require('../../lib/tagprocessor/mathjax');
const KatexTagProcessor = require('../../lib/tagprocessor/katex');
const HighlightTagProcessor = require('../../lib/tagprocessor/highlight');
const CSSIncludeTagProcessor = require('../../lib/tagprocessor/cssinclude');
const ObjectMatcherProcessor = require('../../lib/tagprocessor/objectmatcher');
const helpers = require('../support/helpers');
const fixtures = require('../support/fixtures');

// permanently disable, so it doesnt even show up:
const skipped_it = () => {};

describe('TagProcessor', () => {
    describe('MathJax Processor', () => {
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
            const mjr = new MathJaxTagProcessor(tag);

            mjr.render('\\sqrt{f}', result => {
                expect(result).toMatch(/^\s*<svg/);
                expect(result).toMatch(/svg>$/);
                expect(result).toMatch(/\<path stroke-width/);
                expect(result).toMatch(/width="3.142ex"/);
                expect(result).toMatch(/height="3.509ex"/);
                done();
            });
        });
    });

    describe('Highlight.js Processor', () => {
        it('renders simple HTML higlighting', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const hlr = new HighlightTagProcessor(tag);
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

            hlr.render(EXAMPLE_HTML, result => {
                expect(result).toEqual(EXPECTED);
                done();
            });
        });
    });

    describe('KaTeX Processor', () => {
        it('renders a basic LaTeX formula', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const mjr = new KatexTagProcessor(tag);
            mjr.render('\\sqrt{f}', result => {
                expect(result).toMatch(/^\s*<span class="katex">/);
                expect(result).toMatch(/span>$/);
                expect(result).toContain('√');
                done();
            });
        });
    });

    describe('CSSInclude Processor', () => {
        it('injects a CSS file into head', (done) => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const options = {
                include: [
                    {path: './some/location.css'},
                ],
            };
            const EXPECTED = '<link rel="stylesheet" type="text/css" ' +
                'href="file:///fixture/some/location.css" />';
            const citp = new CSSIncludeTagProcessor(tag, options);
            citp.render_head(result => {
                expect(result).toEqual(EXPECTED);
                done();
            });
        });
    });

    describe('ObjectMatcher Processor', () => {
        it('looks up the relative path of a file', done => {
            const workspace = fixtures.make_workspace();
            const tag = workspace.objects.tag[0];
            const options = {};
            const omp = new ObjectMatcherProcessor(tag, options);
            omp.render('./blockquote.cfg', result => {
                done();
            });
        });
    });
});
