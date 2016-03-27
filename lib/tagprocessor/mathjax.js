'use strict';
const TagProcessor = require('./TagProcessor');

// TODO: Disabled, until we have fully async rendering

// This works with: mathjax-node: 0.5.1

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

class MathJaxTagProcessor extends TagProcessor {
    constructor(tag) {
        super();
        this.tag = tag;
        if (_mathjax === null) {
            _mathjax = start_mathjax();
        }
    }

    get_params(text) {
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

        params.math = text;
        return params;
    }

    render(text, callback) {
        const params = this.get_params(text);
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

module.exports = MathJaxTagProcessor;
