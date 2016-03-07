'use strict';
const Document = require('../../mods/document/Document');
const Tag = require('../../mods/document/Tag');
const helpers = require('../support/helpers');

describe('Document', () => {
    it('does things', () => {
        expect(1+1).toEqual(2);
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
