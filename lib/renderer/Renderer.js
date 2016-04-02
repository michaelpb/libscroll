'use strict';
const lodash = require('lodash');
const TinyTiny = require('../legacy/tinytiny/tinytiny_extensions');

const {TEXT, TAG, OPEN_TAG, CLOSE_TAG} = require('../parser/constants');
const {clean, escape_html, escape_quotes} = require('./utils');

// Keeps track of every render, for StyleRender utilizes this information
let _render_instance = 1234;

class Renderer {
    constructor(opts) {
        const defs = {
            target: "default",
            templater: TinyTiny,
            split_html: /\{%\s*contents\s*%\}/g,
            disable_custom_html: false,
        };
        this.opts = Object.assign(defs, opts);
        this.tags = this.opts.tags;
        this.Template = this.opts.templater;
    }

    new_render_instance(value) {
        _render_instance += (value || 1);
        this.render_instance_id = Renderer._render_instance;
    }

    get_default_template(node, tagname) {
        ////// Fall through, and build template out of built in style
        const tag = node.tag;
        const targetted_style = tag.get("html", this.opts.target);
        if (!this.Template) {
            throw "No templating system, not yet supported.";
            let s = targetted_style.split(this.opts.split_html);
            open_template = s[0] || '';
            close_template = s[1] || '';
        }

        let template_string = targetted_style;
        if (!template_string) {
            if (!tagname) { tagname = tag.is_block() ? 'div' : 'span'; }
            template_string = ['<', tagname,' class="',
                                escape_quotes(tag.tag_class), '">',
                                '{% contents %}', "</", tagname, ">"].join('');
        }

        if (!node.is_unranked) {
            template_string = template_string.replace(this.opts.split_html,
                                "{% head_contents %}") + '{% contents %}';
        }

        return this.Template(template_string);
    }

    _process_content(text_content, enclosing_tag = null) {
        // If an enclosing tag exists with a processor for the given target,
        // then use that
        if (enclosing_tag) {
            const processor = enclosing_tag.get_processor(this.opts.target);
            // console.log('maybe processing!', processor);
            if (processor) {
                const result = processor(text_content);
                // console.log('processing done!', result);
                return result;
            }
        }
        // console.log('not processing');

        // default to just HTML escape
        return escape_html(text_content);
    }

    render_to_string(text, parser, callback) {
        // Do a simple clean, flat render to a string. This is used by the editor
        // to generate working copy representations of data, for example.
        const result = [];
        const emit = (value) => {
            result.push(value);
        };

        let most_recent_tag = null;

        const on_token = (type, tag, text_content) => {
            if (type === OPEN_TAG) {
                most_recent_tag = tag;
                this._emit_open(emit, tag.tag_class, text_content);
            } else if (type === CLOSE_TAG) {
                most_recent_tag = null;
                this._emit_close(emit, tag.tag_class, null);
            } else {
                // TODO: eventually, have the "callback" exist somewhere around
                // here for async content processing
                emit(this._process_content(text_content, most_recent_tag));
            }
        };

        const on_end = () => {
            if (callback) {
                callback(result.join(''));
            }
        };
        parser.parse(text, on_token, on_end);
        if (!callback) {
            return result.join('');
        }
    }
}

module.exports = Renderer;
