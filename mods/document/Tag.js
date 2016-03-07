'use strict';
/* ***************************************
 * Tag represents a single tag           */

const ScrollObject = require('../../lib/ScrollObject');
const async = require('async');
const schemaconf = require('schemaconf');

// Pull in tag schema
const SCHEMA = require('./schemas').tag;
const CONFSCHEMA = new schemaconf.ConfSchema(
    SCHEMA, {"no_exceptions": true});

/* ***************************************
 * Tag represents a single tag           */
class Tag extends ScrollObject {
    static get confschema() {
        return CONFSCHEMA;
    }

    constructor(info) {
        super(info);

        // Get info, like we would find in a tag_name.cfg file
        this.tag_class = this.namespace + '_' + this.name;
        this.css_selector = "." + this.tag_class;
        this.prepared = false;

        this.containment_class = this.info.tag.class;
        if (this.info.markdown) {
            this.contains = this.info.markdown.contains;
        } else {
            this.contains = [];
        }
        this.meta = this.info.tag;
    };

    static load(workspace, relpath, callback) {
        ScrollObject.new_from_cfg(Tag, workspace, relpath, callback);
    }

    static prepare_containment(all_tags, callback) {
        var contained_by = {};

        // First pass, create dicts based on containment keywords
        for (var i in all_tags) {
            var tag = all_tags[i];
            tag.containment_class.forEach(function (keyword) {
                if (!contained_by[keyword]) {
                    contained_by[keyword] = [];
                }
                contained_by[keyword].push(tag);
            });
        }

        // Second pass, populate containment hierarchies for each 
        for (var i in all_tags) {
            var tag = all_tags[i];
            var list = [];

            // Extend list by all children
            tag.contains.forEach(function (keyword) {
                var children = contained_by[keyword] || [];
                list = list.concat(children);
            });

            // Attach list to tag
            tag.containment = new Containment(list, tag.contains);
        }

        callback();
    }
    get_oldstyle_info() {
        return _.extend({
            name: _.str.humanize(this.name),
            help: false,
            short_label: _.str.humanize(this.name),
            markup: this.info.tag[0].markdown
        }, this.info.tag[0]);
    }

    is_block() {
        return this.info.markdown && this.info.markdown.type === 'block';
    }

    is_symbol() {
        return this.info.symbol && this.info.symbol.tag;
    }

    /* "Bakes" CSS and HTML into pre-rendered templates for fast
     * insertion / removal
     */
    prepare(callback) {
        this.css  = {};
        this.html = {};
        for (var i in this.info.style) {
            var style = this.info.style[i];
            var css = this._replace_css_sheet(style.css);
            //var html = this._wrap_html(style.html);
            var html = style.html;

            for (var i in style.target) {
                var target_name = style.target[i];
                this.css[target_name] = css;
                this.html[target_name] = html;
            }
        };

        this.prepared = true;
        callback();
    }


    _replace_css_sheet(css) {
        // Skip over empty CSS
        var s = css;
        if (!s || _.str.trim(s) === '') {
            return '';
        }

        s = css.replace(/CLASS/g, this.tag_class)
            .replace(/TAG/g, this.css_selector)
            .replace(/NS/g, this.namespace)
            .replace(/NAME/g, this.name);

        // remove comments:
        s = s.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '');

        // now clean up, and prefix anything thats missing it with the appropriate
        // class:
        s = s.split("}").map(_.bind(function (declaration) {
            var decr = _.str.clean(declaration);
            if (decr === '') { return ''; }
            if (decr.indexOf(this.css_selector) !== 0) {
                decr = this.css_selector + ' ' + decr;
            }
            return decr;
        }, this)).join("} ");

        // NOTE: this is NOT secure, it is just convenient. It's very
        // easy to "escape" it, e.g. TAG, html { display: none; }

        return s;
    }

    get(type, targets, is_retry) {
        /* Gets a particular rendering for this tag */
        if (_.isString(targets)) { targets = [targets] }
        target = target || ['']; // to force default

        if (type === 'css') { obj = this.css; }
        else { obj = this.html }

        // Now we try a few possibilities:
        for (var i in targets) {
            var target = targets[i];
            if (target in obj) {
                return obj[target];
            }
        }

        if (is_retry) { throw new Error("Tag contains no defaults!"); }
        return this.get(type, ['editor', 'default'], true);
    }
};


/* ***************************************
 * Containment                           */
var Containment = function (contains, names) {
    this.tags = contains;
    this.containment_name = names.sort().join(':');

    this.can_contain_blocks = false;
    for (var i in contains) {
        if (contains[i].is_block()) {
            this.can_contain_blocks = true;
            break;
        }
    }
};

Containment.prototype.has = function (namespace, name) {
    for (var i in this.tags) {
        if (this.tags[i].name === name &&
                this.tags[i].namespace === namespace) {
            return true;
        }
    }
    return false;
};

module.exports = Tag;
