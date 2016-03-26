'use strict';
const TagRenderer = require('./TagRenderer');

// TODO: Test out KaTeX as an alternative renderer

let _mathjax = null;

function start_mathjax(){
    // inspired by mathjax-node-server, MIT License by Tim Arnold
    // https://github.com/tiarno/mathjax-server/
    const mjAPI = require("mathjax-node/lib/mj-single");
    mjAPI.config({
        MathJax: {
            SVG: {
                font: "STIX-Web"
            },
            tex2jax: {
                preview: ["[math]"],
                processEscapes: true,
                processClass: ['math'],
                // inlineMath: [ ['$','$'], ["\\(","\\)"] ],
                // displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
                //skipTags: ["script","noscript","style","textarea","pre","code"]
            },
            TeX: {
                noUndefined: {disabled: true},
                Macros: {
                  mbox: ['{\\text{#1}}',1],
                  mb: ['{\\mathbf{#1}}',1],
                  mc: ['{\\mathcal{#1}}',1],
                  mi: ['{\\mathit{#1}}',1],
                  mr: ['{\\mathrm{#1}}',1],
                  ms: ['{\\mathsf{#1}}',1],
                  mt: ['{\\mathtt{#1}}',1]
                }
            }
        }
    });
    mjAPI.start();
    return mjAPI;
};

class MathJaxTagRenderer extends TagRenderer {
    constructor(tag) {
        super();
        this.tag = tag;
        if (_mathjax === null) {
            _mathjax = start_mathjax();
        }
    }

    get_params(tree_node) {
        const params = {
            format: 'TeX',
            math: '',
            svg: true,
            mml: false,
            png: false,
            speakText: true,
            speakRuleset: 'mathspeak',
            speakStyle: 'default',
            ex: 6,
            width: 1000000,
            linebreaks: false,
        };

        params.math = tree_node.inner_text;
        return params;
    }

    render(tree_node, callback) {
        const params = this.get_params(tree_node);
        // console.log('starting rendering');
        _mathjax.typeset(params, result => {
            // console.log('render finished');
            if (result.errors) {
                // TODO: have error system for rendering
                throw new Error('Error: ' + String(result.errors));
            }
            callback(result.svg);
            /*
            else if (params.mml) {
                // 'Content-Type': 'application/mathml+xml'
                callback(result.mml);
            }
            else if (params.png) {
                // 'Content-Type': 'image/png'
                // The reason for slice(22) to start encoding (from str to binary)
                // after base64 header info--data:image/png;base64,
                callback(new Buffer(result.png.slice(22), 'base64'));
            }
            */
        });
    }
}

module.exports = MathJaxTagRenderer;
