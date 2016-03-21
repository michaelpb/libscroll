'use strict';

const taglex = require('taglex');

const TagLexParser = require('./TagLexParser');

const MD_DEFAULT_OPEN = "%s{";
const MD_DEFAULT_CLOSE = "}";
const MD_CONTAINS = "mdc_";
const PARA_CLOSE = Object.freeze({
    token: '\n\n',                    // canonical token form
    re: '\\s*\\r?\\n\\s*\\r?\\n\\s*', // regular expression to match above
});
const BLOCK_DEFAULT = ['', PARA_CLOSE];

class ScrollMarkdownParser extends TagLexParser {
    /*
     * Creates TagLex TagRuleSet for parsing this thing
     */
    constructor(...args) {
        super(...args);

        this.ruleset = new taglex.TagRuleSet({
            normalizer: function (token) {
                return token.replace(/[ \t\r]/g, '')
                            .replace(/\n\s*\n[\s*\n]*/g, '\n\n');
            },
            root_ignore_text: true,
        });
        this.classes = new taglex.TagClassManager();

        // Compile all relevant lexers
        for (const tag of this.tags) {
            const markdown = tag.info.markdown;
            const aliases = [];
            let parents = [];
            for (const keyword of tag.containment_class) {
                parents = parents.concat(this.classes.get(MD_CONTAINS + keyword));
            }

            /*if (tag_class === 'text') {
                parents = parents.concat(this.classes.get('root'));
            }*/

            const opts = {
                name: tag.tag_class,
                parents: parents,
                payload: tag,
                aliases: aliases,
            };

            if (tag.info.symbol && tag.info.symbol.tag) {
                // Not a normal tag, a symbol tag instead, and continue
                opts.symbol = tag.info.symbol.tag;
                this.ruleset.add_symbol(opts);
                continue;
            }

            if (markdown) {
                // console.warn('---------------------------');
                // console.warn(tag.info.tag.name, '=', markdown.type);
                if (markdown.type === "block") {
                    // block types can always go in root, for now!
                    opts.parents = opts.parents.concat(this.classes.get('root'));
                    opts.force_close = true;

                    // Now we put in suffix stuff
                    if (markdown.block_prefix) {
                        const open = markdown.block_prefix || '';
                        const close = PARA_CLOSE;
                        // console.warn('open', open, close);
                        aliases.push([open, close]);
                    } else if (markdown.block_default) {
                        aliases.push(BLOCK_DEFAULT);
                    }

                } else if (markdown.markdown) {
                    const open_close = markdown.markdown.split("$");
                    aliases.push(open_close);
                }
                // console.warn('parents', opts.parents);

                // Add to containment class
                for (const name of markdown.contains) {
                    this.classes.add(tag.tag_class, MD_CONTAINS + name);
                }
            }

            // set up default, also
            if (aliases.length < 1) {
                // both short and fully qualified
                aliases.push([MD_DEFAULT_OPEN.replace("%s", tag.tag_class),
                            MD_DEFAULT_CLOSE]);
                aliases.push([MD_DEFAULT_OPEN.replace("%s", tag.name),
                            MD_DEFAULT_CLOSE]);
            }

            // Now set up "XML" alternative formats
            // TODO: turn these into regexp that collapse ' ' and '\t'
            aliases.push(["<" + tag.tag_class + ">\n",
                            "\n</" + tag.tag_class + ">"])
            aliases.push(["<" + tag.name + ">\n",
                            "\n</" + tag.name + ">"])

            this.ruleset.add_tag(opts);
        }

        // Mute text node output in root

        // Finally compile the ruleset:
        this.ruleset.compile();
    }
};

module.exports = ScrollMarkdownParser;
