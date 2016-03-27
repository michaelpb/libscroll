'use strict';
const Renderer = require('./Renderer');
const {clean, escape_html, escape_quotes} = require('./utils');

class EditorRenderer extends Renderer {
    constructor(tags, opts) {
        const defs = {
            // attach_source: true,
            tags: tags,
            normalize_source: true,
        };
        super(Object.assign(defs, opts));
        this.normalize_source = this.opts.normalize_source || null;
        this._get_text = escape_html;

        // Compile templates, parse out strings
        this.html_tag_open = {};
        this.html_tag_close = {};
        if (!tags || !tags[Symbol.iterator]) {
            throw new Error('Invalid tags specified ' + tags);
        }
        for (const tag of tags) {
            const targetted_style = tag.get("html", "editor");

            if (tag.is_symbol()) {
                // Symbol is a simple, special case, where the targeted style
                // is always used no matter the context
                if (!targetted_style) {
                    throw new Error("Render style required for symbol: " + tag.info.symbol.tag);
                }
                this.html_tag_open[tag.tag_class] = ['', ''];
                this.html_tag_close[tag.tag_class] = targetted_style;
                continue;
            }

            const open_start = (tag.is_block() ? '<bk class="' : '<in class="')
                                + escape_quotes(tag.tag_class);
            let open_finish = '">';
            let templates = null;
            if (targetted_style) {
                templates = targetted_style.split(this.opts.split_html);
            }

            if (!this.opts.disable_custom_html && templates) {
                // Parse custom HTML
                open_finish += templates[0];
            }

            let close = tag.is_block() ? "</bk>" : "</in>";
            if (!this.opts.disable_custom_html && templates) {
                close = templates[1] + close;
            }

            // Keep split into start and finish
            this.html_tag_open[tag.tag_class] = [open_start, open_finish];
            this.html_tag_close[tag.tag_class] = close;
        }
    }

    _emit_open(emit, tag_class, text_content) {
        if (!(tag_class in this.html_tag_open)) {
            const known = Object.keys(this.html_tag_open).join(', ');
            throw new Error(`Unknown tag: '${tag_class}' (known: ${known})`);
        }
        const tag_open = this.html_tag_open[tag_class];
        emit(tag_open[0]);
        if (text_content) {
            emit('" data="');
            if (this.normalize_source) {
                emit(clean(escape_quotes(text_content)));
            } else {
                emit(escape_quotes(text_content));
            }
        }
        emit(tag_open[1]);
    }

    _emit_close(emit, tag_class, text_context) {
        emit(this.html_tag_close[tag_class]);
    }
}

module.exports = EditorRenderer;
