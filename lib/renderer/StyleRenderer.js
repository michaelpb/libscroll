'use strict';
// TODO: ES6
const lodash = require('lodash');
const {escape_html} = require('./utils');
const Renderer = require('./Renderer');

const NOOP = () => {};

/*
 * StyleRenderer is a typical renderer used during an export operation
 */
class StyleRenderer extends Renderer {
    constructor(tags, style, opts) {
        const defs = {
            tags: tags,
            style: style,
            context: {}, // extra render context
        };
        super(lodash.extend(defs, opts));
        this.tags = tags;
        this.style = style;
        this._cached_templates = {};
        this._get_text = escape_html;
    }

    get_template(node) {
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
    }

    tree_to_string(treenode, opts) {
        opts = opts || {};
        if (lodash.isArray(treenode)) {
            // Render each, then join the result
            let render = lodash.bind(function (node) {
                return this.tree_to_string(node, opts);
            }, this);
            return treenode.map(render).join('');
        }

        if (treenode.rendered && treenode.rendered
                === this.render_instance_id) {
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
    }

    render_to_string(text, parser, callback = NOOP) {
        this.new_render_instance(text.length);
        // Top-down render to string
        let result = null;
        parser.parse(text, NOOP, (tree) => {
            result = this.tree_to_string(tree)
            callback(result);
        });
        return result;
    }
}

module.exports = StyleRenderer;
