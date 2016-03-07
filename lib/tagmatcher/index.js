const lodash = require('lodash');

const TagMatcher = function (code) {
    // Incorporates the tag matching microlanguage
    this.code = code;
    this.checkers = this.parse_to_checkers(code);
};

TagMatcher.parse_matcher = function (v) {
    var val;
    var cmp = function (s) {
        var startswith = v.indexOf(s) === 0;
        if (startswith) { val = v.slice(s.length); return true; }
        else { return false; }
    }

    if (cmp("exact:")) {
        return function (taginfo) {
            return val === taginfo.tag_class;
        };
    };

    if (cmp("class:")) {
        return function (taginfo) {
            classes = taginfo.info.tag.class;
            return classes.indexOf(val) !== -1;
        };
    };

    if (cmp("namespace:")) {
        return function (taginfo) {
            return val === taginfo.namespace;
        };
    };

    if (cmp("sclass:")) {
        return function (taginfo) {
            if (!taginfo.sclass) { return false; }
            return taginfo.sclass.indexOf(val) !== -1;
        };
    };

    // default is "tagname"
    return function (taginfo) {
        return taginfo.name === v;
    };
};

TagMatcher.prototype.parse_to_checkers = function (code) {
    var words = lodash.words(code);
    var checkers = [];
    for (var i in words) {
        var word = words[i];
        checkers.push(TagMatcher.parse_matcher(words[i]));
    }
    return checkers;
};

TagMatcher.prototype.matches_root = function () {
    return this.code === "root";
};

TagMatcher.prototype.match = function (taginfo) {
    for (var i in this.checkers) {
        if (this.checkers[i](taginfo)) {
            return true;
        }
    }
    return false;
};

const Types = {
    tagmatcher: {
        stringify: function (v) {
            return !(v instanceof TagMatcher) ? new TypeError()
                    : v.code;
        },
        parse: function (v) {
            return new TagMatcher(v);
        },
    },
};

module.exports.Types = Types;
module.exports.TagMatcher = TagMatcher;
module.exports.schema_type = Types.tagmatcher;
