'use strict';
/* ***************************************
 * Tag represents a single tag           */

const ScrollObject = require('../../lib/ScrollObject');
const async = require('async');
const schemaconf = require('schemaconf');
const lodash = require('lodash');
function clean(str) {
    return lodash.trim(str.replace(/[\n\r\s]+/g, ' '));
}

// Pull in tag schema
const SCHEMA = require('./schemas').tag;
const CONFSCHEMA = new schemaconf.ConfSchema(
    SCHEMA, {"no_exceptions": true});

const NOOP = () => {};

function get_tag_processor_path(name) {
    return `../../lib/tagprocessor/${name}`;
}

/* ***************************************
 * Tag represents a single tag           */
class Tag extends ScrollObject {
    static get confschema() {
        return CONFSCHEMA;
    }

    constructor(...args) {
        super(...args);

        // Get info, like we would find in a tag_name.cfg file
        this.tag_class = this.namespace + '_' + this.name;
        this.css_selector = "." + this.tag_class;

        this.containment_class = this.info.tag.class;
        if (this.info.markdown) {
            this.contains = this.info.markdown.contains;
        } else {
            this.contains = [];
        }

        // v-- remove me
        // this.meta = this.info.tag;
        this._prepare();
        this.processor_cache = {};
    };

    static load(workspace, relpath, callback) {
        ScrollObject.new_from_cfg(Tag, workspace, relpath, callback);
    }

    static prepare_containment(all_tags, callback) {
        let contained_by = {};

        // First pass, create dicts based on containment keywords
        for (const tag of all_tags) {
            tag.containment_class.forEach(keyword => {
                if (!contained_by[keyword]) {
                    contained_by[keyword] = [];
                }
                contained_by[keyword].push(tag);
            });
        }

        // Second pass, populate containment hierarchies for each 
        for (const tag of all_tags) {
            let list = [];

            // Extend list by all children
            tag.contains.forEach(keyword => {
                const children = contained_by[keyword] || [];
                list = list.concat(children);
            });

            // Attach list to tag
            tag.containment = new Containment(list, tag.contains);
        }

        callback();
    }

    /*
     * Given an array of Tags, and a render target, render any CSS styles that
     * should be injected at top
     */
    static render_css(tags, target) {
        // Use a set to prevent duplication, e.g. make idempotent
        const result_set = new Set();

        // First, render plain CSS
        result_set.add(tags.map(tag => tag.get('css', target)).join(''));

        // Second, render processor CSS
        for (const tag of tags) {
            let processors = tag._get_processors(target);
            processors = processors.filter(processor => processor.render_css);
            for (const processor of processors) {
                result_set.add(processor.render_css(NOOP));
            }
        }

        // Finally, join set
        return Array.from(result_set).join('');
    }

    /*
     * Given an array of Tags, and a render target, render any HTML content
     * that should be inserted between the <head></head> tags
     */
    static render_head(tags, target) {
        // Use a set to prevent duplication, e.g. make idempotent
        const result_set = new Set();

        // Only processors generate head, so render that:
        for (const tag of tags) {
            let processors = tag._get_processors(target);
            processors = processors.filter(processor => processor.render_head);
            for (const processor of processors) {
                result_set.add(processor.render_head(NOOP));
            }
        }

        // Finally, join set
        return Array.from(result_set).join('');
    }

    /*
     * "Bakes" CSS and HTML into pre-rendered templates for fast
     * insertion / removal
     */
    _prepare() {
        this.css  = {};
        this.html = {};
        for (const style of (this.info.style || [])) {
            const css = this._replace_css_sheet(style.css);
            //let html = this._wrap_html(style.html);
            const html = style.html;

            for (const target_name of (style.target || [])) {
                this.css[target_name] = css;
                this.html[target_name] = html;
            }
        };
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

    _replace_css_sheet(css) {
        // Skip over empty CSS
        let s = css;
        if (!s || lodash.trim(s) === '') {
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
        s = s.split("}").map(declaration => {
            let decr = clean(declaration);
            if (decr === '') { return ''; }
            if (decr.indexOf(this.css_selector) !== 0) {
                decr = this.css_selector + ' ' + decr;
            }
            return decr;
        }).join("} ");

        // NOTE: this is NOT secure, it is just convenient. It's very
        // easy to "escape" it, e.g. TAG, html { display: none; }

        return s;
    }

    get(type, targets = [], is_retry) {
        /* Gets a particular rendering for this tag */
        targets = targets instanceof String ? [targets] : targets;
        const obj = type === 'css' ? this.css : this.html;

        // Now we try a few possibilities:
        for (const target of targets) {
            if (target in obj) {
                return obj[target];
            }
        }

        if (is_retry) {
            throw new Error("Tag contains no defaults!");
        }

        // Fallback to defaults
        return this.get(type, ['editor', 'default'], true);
    }

    _get_processors(target) {
        const matches = [];
        for (const proc_info of (this.info.processor || [])) {
            if (!proc_info.target || proc_info.target.length === 0 ||
                    proc_info.target.indexOf(target) !== -1) {
                // found a match
                matches.push(proc_info);
            }
        }

        if (matches.length > 0) {
            // Now, load all processors, and return a callback that will
            // process it
            return matches.map(this.load_processor, this);
        }

        return [];
    }

    /*
     * Gets processors for the given target for a render operation
     */
    get_processor(target) {
        let processors = this._get_processors(target);
        // Only get those with render:
        processors = processors.filter(processor => processor.render);
        if (processors.length < 1) {
            return null;
        }

        // Otherwise, return a single function that does all the processing
        return text_content => {
            for (const processor of processors) {
                // todo: needs async update here
                text_content = processor.render(text_content, NOOP);
            }
            return text_content;
        };
    }

    load_processor(processor_info) {
        // We cache them, in the case that instantiation takes time or they
        // have internal caches
        if (this.processor_cache[processor_info.name]) {
            return this.processor_cache[processor_info.name];
        }

        const path = get_tag_processor_path(processor_info.name);
        const module = require(path); 
        const instance = new module(this, processor_info.options);
        this.processor_cache[processor_info.name] = instance;
        return instance;
    }
};


/* ***************************************
 * Containment                           */
const Containment = function (contains, names) {
    this.tags = contains;
    this.containment_name = names.sort().join(':');
    this.can_contain_blocks = contains.some(tag => tag.is_block());
};

Containment.prototype.has = function (namespace, name) {
    return this.tags
        .some(tag => tag.name === name && tag.namespace === namespace);
};

module.exports = Tag;
