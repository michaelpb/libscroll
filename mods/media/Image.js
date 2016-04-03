'use strict';
const ScrollObject = require('../../lib/ScrollObject');
const async = require('async');

class Image extends ScrollObject {
    static load(workspace, relpath, callback) {
        ScrollObject.new_from_binary(Image, workspace, relpath, callback);
    }
};

module.exports = Image;
