'use strict';
const Structure = require('../../mods/style/Structure');
const helpers = require('../support/helpers');

describe('Structure', () => {
    describe('when testing loaded tags', () => {
        let st;
        let tags;
        beforeEach((done) => {
            helpers.load_tags((loaded_tags) => {
                tags = loaded_tags;
                helpers.load_structure(
                    {structure_file_name: 'structure.cfg'},
                    (loaded_structures) => {
                        st = loaded_structures[0];
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

            expect(st.hierarchy_cmp(section, para)).toEqual(st.LEFT_HIGHER);
            // TODO this should pass! -----v
            //expect(st.hierarchy_cmp(blockquote, section)).toEqual(st.RIGHT_HIGHER);
            expect(st.hierarchy_cmp(para, blockquote)).toEqual(st.EQUAL);
            expect(st.hierarchy_cmp(para, strong)).toEqual(st.LEFT_HIGHER);
            expect(st.hierarchy_cmp(section, strong)).toEqual(st.LEFT_HIGHER);
        });
    });
});
