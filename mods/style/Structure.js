'use strict';
const ScrollObject = require('../../lib/ScrollObject');
const lodash = require('underscore');
const schemaconf = require('schemaconf');

const {LEFT_EARLIER, LEFT_HIGHER, EQUAL, RIGHT_EARLIER, RIGHT_HIGHER,
    UNRANKED} = require('../../lib/parser/constants');

// Pull in tag schema
const SCHEMA = require('./schemas').structure;
const CONFSCHEMA = new schemaconf.ConfSchema(
    SCHEMA, {"no_exceptions": true});

class Structure extends ScrollObject {
    constructor(info) {
        super(info);
        this.structure = info.structure;

        // Create matchers based on structure
        this.get_ordering_index = this._make_matcher(this.structure.ordering);
        this.get_hierarchy_index = this._make_matcher(this.structure.hierarchy);
        this.ROOT = Structure.ROOT; // a few things reference it here
    }

    static load(workspace, relpath, callback) {
        ScrollObject.new_from_cfg(Structure, workspace, relpath, callback);
    }

    static get confschema() {
        return CONFSCHEMA;
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

    _make_matcher(obj) {
        // shortcut: everyone ties if there is nothing specified for the given type
        if (!obj) { return () => 0; }

        // prepare structure
        const sparse_matchers = [];
        for (let index in obj) {
            let index_val = parseInt(index);
            if (index_val === NaN) { throw "invalid structure:" + index; }
            sparse_matchers.push([obj[index], index_val]);
        }

        // sort by rank
        sparse_matchers.sort((a, b) => a[1] > b[1]);

        // fill in gaps
        var matchers = sparse_matchers.map(v => v[0]);
        var matchers_length = matchers.length;

        // return "structure matcher"
        return (taginfo) => {
            if (taginfo === Structure.ROOT) {
                return UNRANKED; // unranked
            }

            for (let value = 0; value < matchers_length; value++) {
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
            return order === LEFT_EARLIER ||
                order === EQUAL;
        }, this));
    }
}

module.exports = Structure;
