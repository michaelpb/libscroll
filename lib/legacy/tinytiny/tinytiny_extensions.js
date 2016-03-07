var TinyTiny = require('../tinytiny/tinytiny');

TinyTiny.tags.render = function (n, G) {
    var split = n.split(' with ');
    var expression = G.x(split[0]);
    var renderer = split[1] ? G.x(split[1]) : 'x.renderer';
    return ['l.push(', renderer, '.tree_to_string(', expression, '));'].join('');
};

TinyTiny.tags.contents = function (n, G) {
    return 'l.push(x.renderer.tree_to_string(x.node.children));';
};


TinyTiny.tags.head_contents = function (n, G) {
    return 'l.push(x.renderer.tree_to_string(x.node.head));';
};

TinyTiny.tags.pluck = function (n, G) {
    var split = n.split(' from ');
    var tagname = G.x(split[0]);
    var renderer = split[1] ? G.x(split[1]) : 'x.node.children';
    return [
        'l.push(',
            'x.renderer.tree_to_string(',
                'x.node.children.filter(function (node) {',
                    // todo add arbitrary TagMatcher things
                    'return node.tag === "' + tagname + '"; ',
                '}),',
            '{mark: true})',
        ');',
    ].join('');
};

module.exports = TinyTiny;
