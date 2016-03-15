'use strict';

const lodash = require('lodash');

class ObjectMatcher {
    constructor(code) {
        // Incorporates the object matching microlanguage
        this.code = code;
        this.checkers = code.split(/[\n\r\s]+/)
            .map(ObjectMatcher.parse_matcher);
    }

    static parse_matcher(initial_value) {
        let val;
        function cmp(s) {
            const startswith = initial_value.indexOf(s) === 0;
            if (!startswith) {
                return false;
            }
            val = initial_value.slice(s.length);
            return true;
        }

        if (cmp('exact:')) {
            return obj => val === obj.fullname;
        }

        if (cmp('class:')) {
            return obj => obj.classnames.indexOf(val) !== -1;
        }

        if (cmp('namespace:')) {
            return obj => val === obj.namespace;
        }

        if (cmp('path:')) {
            return obj => obj.path && (obj.path.indexOf(val) !== -1);
        }

        if (cmp('sclass:')) {
            return obj => obj.sclass && (obj.sclass.indexOf(val) !== -1);
        }

        // default is 'name'
        return obj => obj.name === initial_value;
    }

    matches_root() {
        return this.code === 'root';
    }

    match(obj) {
        for (var i in this.checkers) {
            if (this.checkers[i](obj)) {
                return true;
            }
        }
        return false;
    }
}

const Types = {
    objectmatcher: {
        stringify: function (v) {
            return !(v instanceof ObjectMatcher) ? new TypeError()
                    : v.code;
        },
        parse: function (v) {
            return new ObjectMatcher(v);
        },
    },
};

module.exports.Types = Types;
module.exports.TagMatcher = ObjectMatcher;
module.exports.ObjectMatcher = ObjectMatcher;
module.exports.schema_type = Types.objectmatcher;
