'use strict';
const ScrollObject = require('../../lib/ScrollObject');
const lodash = require('underscore');
const schemaconf = require('schemaconf');

class Structure extends ScrollObject {
    constructor(info) {
        super(info);
        this.structure = info.structure;
    }

    static get ROOT() {
        return {name: "root", namespace: ""};
    }

    static cmp(a, b) {
        return  a === b ? EQUAL
                : a > b ? RIGHT_HIGHER
                : LEFT_HIGHER;
    }

    /******* Compare tag_a's and tag_b's ordering */
    order_cmp(tag_a, tag_b) {
        // 1. Attach classes
        this._prep_tags(tag_a, tag_b);

        // 2. get vals
        var i_a = this.get_ordering_index(tag_a);
        var i_b = this.get_ordering_index(tag_b);
        return Structure.cmp(i_a, i_b);
    }

    /******* Compare tag_a's and tag_b's hierarchy */
    hierarchy_cmp(tag_a, tag_b) {
        // 1. Attach classes
        this._prep_tags(tag_a, tag_b);

        // 2. get vals
        var i_a = this.get_hierarchy_index(tag_a);
        var i_b = this.get_hierarchy_index(tag_b);
        return Structure.cmp(i_a, i_b);
    }

    prepare(callback) {
        // Create matchers based on structure
        this.get_ordering_index = this._make_structure_matcher(this.structure.ordering);
        this.get_hierarchy_index = this._make_structure_matcher(this.structure.hierarchy);
        callback();
    }

    _make_structure_matcher(obj) {
        // shortcut: everyone ties if there is nothing specified for the given type
        if (!obj) { return function () { return 0; } }

        // prepare structure
        var sparse_matchers = [];
        for (var index in obj) {
            var index_val = parseInt(index);
            if (index_val === NaN) { throw "invalid structure:" + index; }
            sparse_matchers.push([obj[index], index_val]);
        }

        // sort by rank
        sparse_matchers.sort(function (a, b) { return a[1] > b[1]; });

        // fill in gaps
        var matchers = sparse_matchers.map(function (v) { return v[0]; });
        var matchers_length = matchers.length;

        // return "structure matcher"
        return function (taginfo) {
            if (taginfo === Structure.ROOT) {
                return UNRANKED; // unranked
            }

            for (var value = 0; value < matchers_length; value++) {
                if (matchers[value].match(taginfo)) {
                    return value;
                }
            }
            return UNRANKED; // unranked
        };
    }

    _attach_classes(tag) {
        tag.sclass = [];
        for (var class_name in this.structure.classes) {
            var matcher = this.structure.classes[class_name];
            if (matcher.match(tag)) {
                tag.sclass.push(class_name);
            }
        }
    }

    _prep_tags(tag_a, tag_b) {
        /*
        if (typeof tag_a.sclass === "undefined") {
            this._attach_classes(tag_a);
        }

        if (typeof tag_b.sclass === "undefined") {
            this._attach_classes(tag_b);
        }
        */
    }

    filter_ordering(tag_context, taglist) {
        // Returns "what can come after" tag_context
        /// xxx actually need to check if "directly proceed"
        return taglist.all_tags.filter(lodash.bind(function (tag) {
            var order = this.order_cmp(tag_context, tag);
            return order === Structure.LEFT_EARLIER ||
                order === Structure.EQUAL;
        }, this));
    }
}

const LEFT_EARLIER = Structure.prototype.LEFT_EARLIER = -1;
const LEFT_HIGHER = Structure.prototype.LEFT_HIGHER = -1;
const EQUAL = Structure.prototype.EQUAL = 0;
const RIGHT_EARLIER = Structure.prototype.RIGHT_EARLIER = 1;
const RIGHT_HIGHER = Structure.prototype.RIGHT_HIGHER = 1;
const UNRANKED = Structure.prototype.UNRANKED = {"unranked": true};

module.exports = Structure;
