'use strict';
// TODO: ES6
const TinyTiny = require('../legacy/tinytiny/tinytiny_extensions');
const lodash = require('lodash');

function clean(str) {
    return lodash.trim(str).replace(/\s\s+/g, ' ');
}

const TEXT = 1;
const TAG  = 2;
const OPEN_TAG  = 3;
const CLOSE_TAG = 4;

const escape_html = function (text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
};

const escape_quotes = function (text) {
    return text.replace(/"/g, "&quot;");
};

const Renderer = function (opts) {
    const defs = {
        target: "editor",
        templater: TinyTiny,
        split_html: /\{%\s*contents\s*%\}/g,
        disable_custom_html: false,
    };
    this.opts = lodash.extend(defs, opts);
    this.tags = this.opts.tags;
    this.Template = this.opts.templater;
};

Renderer._render_instance = 1234;
Renderer.prototype.new_render_instance = function (i) {
    Renderer._render_instance += (i || 1);
    this.render_instance_id = Renderer._render_instance;
};

Renderer.prototype.get_default_template = function (node, tagname) {
    ////// Fall through, and build template out of built in style
    let tag = node.tag;
    let targetted_style = tag.get("html", this.opts.target);
    let _this = this;
    if (!this.Template) {
        // No templating system, not yet supported
        throw "Not implemented yet."
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
};

Renderer.prototype.render_to_string = function (text, parser, callback) {
    // Do a simple clean, flat render to a string. This is used by the editor
    // to generate working copy representations of data, for example.
    let result = [];
    let tag_class_tack = [];
    let _this = this;
    const emit = () => result.push(result);

    let on_token = function (type, tag, text_content) {
        if (type === OPEN_TAG) {
            _this._emit_open(emit, tag.tag_class, text_content);
        } else if (type === CLOSE_TAG) {
            _this._emit_close(emit, tag.tag_class, null);
        } else {
            emit(_this._get_text(text_content));
        }
    };

    let on_end = function () {
        callback(result.join(""));
    };
    parser.parse(text, on_token, on_end);
};


let EditorRenderer = function (tags, opts) {
    let defs = {
        //attach_source: true,
        tags: tags,
        normalize_source: true,
    };
    Renderer.call(this, lodash.extend(defs, opts));

    this.normalize_source = this.opts.normalize_source || null;
};

EditorRenderer.prototype = new Renderer;

EditorRenderer.prototype.compile = function (callback) {
    // Compile templates, parse out strings
    this.html_tag_open = {};
    this.html_tag_close = {};
    let tags = this.tags;
    for (let i in tags) {
        let tag = tags[i];
        let targetted_style = tag.get("html", "editor");

        if (tag.is_symbol()) {
            // Symbol is a simple, special case, where the targeted style is
            // always used no matter the context
            if (!targetted_style) {
                throw new Error("Render style required for symbol: " + tag.info.symbol.tag);
            };
            this.html_tag_open[tag.tag_class] = ['', ''];
            this.html_tag_close[tag.tag_class] = targetted_style;
            continue;
        }

        let open_start = (tag.is_block() ? '<bk class="' : '<in class="')
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
    callback();
};

EditorRenderer.prototype._emit_open = function (emit, tag_class, text_content) {
    let tag_open = this.html_tag_open[tag_class];
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
};

EditorRenderer.prototype._emit_close = function (emit, tag_class, text_context) {
    emit(this.html_tag_close[tag_class]);
};

EditorRenderer.prototype._get_text = escape_html;


/*
 * StyleRenderer is a typical renderer used during an export operation
 */
let StyleRenderer = function (tags, style, opts) {
    let defs = {
        tags: tags,
        style: style,
        context: {}, // extra render context
    };

    this.tags = tags;
    this.style = style;
    this._cached_templates = {};
    Renderer.call(this, lodash.extend(defs, opts));
};

StyleRenderer.prototype = new Renderer;

StyleRenderer.prototype.compile = function (callback) {
    // Style renderer compiles its templates on the fly
    callback();
};

StyleRenderer.prototype.get_template = function (node) {
    // STYLE RULES PRECEDENCE (think CSS)
    // 1. Direct match from Style
    // 2. Direct match from parent Style
    // 3. Default tag-defined fallback

    // First, check if there is a direct match
    let tag = node.tag;

    if (tag.name === "root") {
        // Root tag, search for root in particular
        let root = this.style.get_root();
        if (root) {
            // Root specified, use
            let template = this.Template(root.template);
            return template;
        } else {
            // default to simple concatenating children for root
            return this.Template("{% contents %}");
        }
    }

    ////// Check style matches
    let style = this.style.get_style(tag);
    if (style && style.template) {
        let template = this.Template(style.template);
        return template;
    } else if (style && (style.open_template || style.close_template)) {
        // "Pre-split" style template
        return this.Template([style.open_template || '',
                    '{% contents %}', style.close_template || ''].join(''));
    }
    // style does not have necessary info for the tag

    ////// Check parent style matches
    // (look up style of .parent), and see if we have a child
    // match, e.g. _first_para or something)
    // TODO requires  "positional TagMatcher", for :first and
    // :nth-child type matching


    ////// Fall through, and build template out of built in style
    return this.get_default_template(node);
};


StyleRenderer.prototype._get_text = escape_html;

StyleRenderer.prototype.tree_to_string = function (treenode, opts) {
    opts = opts || {};
    if (lodash.isArray(treenode)) {
        // Render each, then join the result
        let render = lodash.bind(function (node) {
            return this.tree_to_string(node, opts);
        }, this);
        return treenode.map(render).join('');
    }

    if (treenode.rendered && treenode.rendered === this.render_instance_id) {
        return ''; // already rendered!
    }

    if (treenode.is_text) {
        // text node
        return this._get_text(treenode.text);
    }

    let template = this.get_template(treenode);
    // Ctx is shallow copy of opts context
    let ctx = lodash.extend({}, this.opts.context, {
        node: treenode,
        tag: treenode.tag,
        renderer: this,
    });

    if (opts.mark) {
        node.rendered = this.render_instance_id;
    }

    return template(ctx);
};

StyleRenderer.prototype.render_to_string = function (text, parser, callback) {
    this.new_render_instance(text.length);
    // Top-down render to string
    let _this = this;
    parser.parse(text, function () {}, function (tree) {
        callback(_this.tree_to_string(tree));
    });
};

module.exports.StyleRenderer = StyleRenderer;
module.exports.EditorRenderer = EditorRenderer;
