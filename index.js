"use strict";

/**
* Require dependencies
*/
var postcss = require('postcss');

/**
* Set default selectors
*/
var defaultselectors = {
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

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse(seletors, options) {

    return function (css) {

        options = options || {};

        var seletormap = Object.assign(seletors, defaultselectors);

        var keepers = selectormap[options.device].keepers;
        var removeables = selectormap[options.device].removeables;
        var convertibles = selectormap[options.device].convertibles;

        var selectorCount = [];

        // Processing code will be added here

        css.walkRules(function (rule) {

            var selectors = rule.selector.split(','),
                selectorsLength = selectors.length,
                parsedSelectors = [];

            for (var j = 0; j < selectorsLength; j++) {
                selectorCount.push(selectors[j]);

                var selectorLine = selectors[j];

                if (typeof removeables !== 'undefined') {
                    for (var i = 0; i < removeables.length; i++) {
                        if (selectorLine.indexOf(`${removeables[i]} `) !== -1) {
                            selectorLine = '';
                        }
                    };
                };

                if (typeof convertibles !== 'undefined') {
                    for (var i = 0; i < convertibles.length; i++) {
                        if (selectorLine.indexOf(convertibles[i]) !== -1) {
                            selectorLine = selectorLine.replace(`${convertibles[i]} `, '');
                        }
                    };
                };

                if (selectorLine.indexOf(options.device) !== -1) {
                    selectorLine = selectorLine.replace(`.${options.device} `, '');
                };

                if (selectorLine !== '') {
                    parsedSelectors.push(selectorLine);
                };

            }

            if (parsedSelectors.length > 0) {
                rule.selector = parsedSelectors.join(',');
            } else {
                rule.remove();
            }

        });

        console.log(`Your ${options.device} CSS uses ${selectorCount.length} selectors`);

    }

});