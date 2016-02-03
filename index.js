var postcss = require('postcss');

var selectormap = {
    desktop     : {
        removeables: ['.smartphone', '.tablet'],
    },
    smartphone  : {
        removeables: ['.desktop', '.tablet', ':hover'],
    },
    tablet      : {
        removeables: ['.smartphone', ':hover'],
        convertibles: ['.desktop'],
    },
};

module.exports = postcss.plugin('myplugin', function myplugin(options) {

    return function (css) {

        options = options || {};
        var removeables = selectormap[options.device].removeables;
        var convertibles = selectormap[options.device].convertibles;

        // Processing code will be added here

        css.walkRules(function (rule) {
            if (typeof removeables !== 'undefined') {
                for (var i = removeables.length; i--;) {

                    if (rule.selector.indexOf(removeables[i]) !== -1) {
                        rule.remove();
                    }

                };
            }
            if (typeof convertibles !== 'undefined') {
                for (var i = convertibles.length; i--;) {

                    if (rule.selector.indexOf(convertibles[i]) !== -1) {
                        rule.selector = rule.selector.replace(convertibles[i], '');
                    }

                };
            }

            if (rule.selector.indexOf(options.device) !== -1) {
                rule.selector = rule.selector.replace('.' + options.device + ' ', '');
            };

        });

    }

});