'use strict';
const Image = require('../../mods/media/Image');
const helpers = require('../support/helpers');

describe('Image', () => {
    describe('when testing loaded images', () => {
        let images;
        beforeEach(done => {
            helpers.load_images(loaded_images => {
                images = loaded_images;
                done();
            });
        });
        afterEach(() => { images = null; })

        it('loads all', () => {
            expect(images.length).toEqual(2);
        });
    });
});


