'use strict';
const {ObjectMatcher} = require('../../lib/objectmatcher');
const helpers = require('../support/helpers');

function match(str, taginfo) {
    return new ObjectMatcher(str).match(taginfo);
}

describe('ObjectMatcher', () => {
    let tags;
    beforeEach((done) => {
        helpers.load_tags((loaded_tags) => {
            tags = loaded_tags;
            done();
        });
    });

    afterEach(() => {
        tags = null;
    });

    it('matches tags correctly', () => {
        const test = {
            ok: (val, message) => {
                if (!val) {
                    console.log('INVALID:', message);
                }
                expect(val).toBeTruthy();
            }
        };

        // there are 5 test tags
        const para = tags.find(tag => tag.name === 'para');
        const section = tags.find(tag => tag.name === 'section');
        const blockquote = tags.find(tag => tag.name === 'blockquote');
        const emphasis = tags.find(tag => tag.name === 'emphasis');
        const strong = tags.find(tag => tag.name === 'strong');

        test.ok(match("para", para), "Tag name");
        test.ok(!match("para", section), "Tag name (negative)");
        test.ok(match("section para", para), "Tag name, multiple 1");
        test.ok(match("section para", section), "Tag name, multiple 2");
        test.ok(match("class:text", para), "Class name");
        test.ok(!match("class:text", emphasis), "Class name (negative)");
        test.ok(match("exact:default_blockquote", blockquote), "Exact");
        test.ok(!match("exact:default_blockquote", emphasis), "Exact (negative)");
        test.ok(match("namespace:default", emphasis), "Namespace");
        test.ok(!match("namespace:lol", emphasis), "Namespace (negative)");

        // Test reuse:
        const tm = new ObjectMatcher("namespace:nope class:simplestyle "+
                "exact:default_section class:nope exact:asdf sclass:nope");
        test.ok(tm.match(emphasis), "Multiple 0");
        test.ok(!tm.match(strong),  "Multiple 1");
        test.ok(!tm.match(para),    "Multiple 2");
        test.ok(tm.match(section),  "Multiple 3");
    });
});
