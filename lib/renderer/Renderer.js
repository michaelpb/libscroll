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
            target: "editor",
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

    render_to_string(text, parser, callback) {
        // Do a simple clean, flat render to a string. This is used by the editor
        // to generate working copy representations of data, for example.
        const result = [];
        const emit = (value) => {
            result.push(value);
        };

        const on_token = (type, tag, text_content) => {
            if (type === OPEN_TAG) {
                this._emit_open(emit, tag.tag_class, text_content);
            } else if (type === CLOSE_TAG) {
                this._emit_close(emit, tag.tag_class, null);
            } else {
                emit(this._get_text(text_content));
            }
        };

        const on_end = () => {
            callback(result.join(''));
        };
        parser.parse(text, on_token, on_end);
    }
}

module.exports = Renderer;
