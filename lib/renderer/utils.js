const lodash = require('lodash');

function clean(str) {
    return lodash.trim(str.replace(/[\n\r\s]+/g, ' '));
}

function escape_html(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
}

function escape_quotes(text) {
    return text.replace(/"/g, '&quot;');
}

module.exports = {clean, escape_html, escape_quotes};
