'use strict';
const TagProcessor = require('./TagProcessor');

let _hl = null;

// TODO: allow other styles, also add a tag prefix of some type to `pre'
/*
github.com style (c) Vasily Polovnyov <vast@whiteants.net>
*/
const CSS_STYLE = [
    'pre .comment,',
    'pre .template_comment,',
    'pre .diff .header,',
    'pre .javadoc {',
    '  color: #998;',
    '  font-style: italic',
    '}',
    '',
    'pre .keyword,',
    'pre .css .rule .keyword,',
    'pre .winutils,',
    'pre .javascript .title,',
    'pre .lisp .title,',
    'pre .subst {',
    '  color: #000;',
    '  font-weight: bold',
    '}',
    '',
    'pre .number,',
    'pre .hexcolor {',
    '  color: #40a070',
    '}',
    '',
    'pre .string,',
    'pre .tag .value,',
    'pre .phpdoc,',
    'pre .tex .formula {',
    '  color: #d14',
    '}',
    '',
    'pre .title,',
    'pre .id {',
    '  color: #900;',
    '  font-weight: bold',
    '}',
    '',
    'pre .javascript .title,',
    'pre .lisp .title,',
    'pre .subst {',
    '  font-weight: normal',
    '}',
    '',
    'pre .class .title,',
    'pre .haskell .label,',
    'pre .tex .command {',
    '  color: #458;',
    '  font-weight: bold',
    '}',
    '',
    'pre .tag,',
    'pre .tag .title,',
    'pre .rules .property,',
    'pre .django .tag .keyword {',
    '  color: #000080;',
    '  font-weight: normal',
    '}',
    '',
    'pre .attribute,',
    'pre .variable,',
    'pre .instancevar,',
    'pre .lisp .body {',
    '  color: #008080',
    '}',
    '',
    'pre .regexp {',
    '  color: #009926',
    '}',
    '',
    'pre .class {',
    '  color: #458;',
    '  font-weight: bold',
    '}',
    '',
    'pre .symbol,',
    'pre .ruby .symbol .string,',
    'pre .ruby .symbol .keyword,',
    'pre .ruby .symbol .keymethods,',
    'pre .lisp .keyword,',
    'pre .tex .special,',
    'pre .input_number {',
    '  color: #990073',
    '}',
    '',
    'pre .builtin,',
    'pre .built_in,',
    'pre .lisp .title {',
    '  color: #0086b3',
    '}',
    '',
    'pre .preprocessor,',
    'pre .pi,',
    'pre .doctype,',
    'pre .shebang,',
    'pre .cdata {',
    '  color: #999;',
    '  font-weight: bold',
    '}',
    '',
    'pre .deletion {',
    '  background: #fdd',
    '}',
    '',
    'pre .addition {',
    '  background: #dfd',
    '}',
    '',
    'pre .diff .change {',
    '  background: #0086b3',
    '}',
    '',
    'pre .chunk {',
    '  color: #aaa',
    '}',
    '',
    'pre .tex .formula {',
    '  opacity: 0.5;',
    '}',
].join('\n');


class HighlightTagProcessor extends TagProcessor {
    constructor(tag) {
        super();
        this.tag = tag;
        if (_hl === null) {
            _hl = require("highlight").Highlight;
        }
    }

    render(code, callback) {
        const rendered = _hl(code);
        // console.log('rendered code', rendered);
        callback(rendered);
        return `<pre>${rendered}</pre>`;
    }

    render_css(callback) {
        callback(CSS_STYLE);
        return CSS_STYLE;
    }
}

module.exports = HighlightTagProcessor;
