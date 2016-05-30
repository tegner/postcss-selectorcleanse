"use strict";

/**
* Require dependencies
*/
var postcss = require('postcss');

/**
* Set default selectors
*/
var defaultselectors = {
    desktop     : [
        {
            selector: '.desktop',
            type: 'keep'
        },
        {
            selector: '.smartphone',
            type: 'remove'
        },
        {
            selector: '.tablet',
            type: 'remove'
        },
    ],
    smartphone  : [
        {
            selector: '.smartphone',
            type: 'keep'
        },
        {
            selector: '.desktop',
            type: 'remove'
        },
        {
            selector: '.tablet',
            type: 'remove'
        },
        {
            selector: ':hover',
            type: 'remove'
        },
    ],
    tablet      : [
        {
            selector: '.tablet',
            type: 'keep'
        },
        {
            selector: '.smartphone',
            type: 'remove'
        },
        {
            selector: ':hover',
            type: 'remove'
        },
        {
            selector: '.desktop',
            type: 'convert'
        },
    ]
};

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse(options) {

    return function (css) {

        options = options || {};
        options.selectors = options.selectors || {};

        var selectormap = Object.assign({}, options.selectors, defaultselectors);

        if (typeof options.cleanser !== 'undefined') {
            var editableSelectors = selectormap[options.cleanser];
        } else {
            for (var key in options.selectors) {
                var editableSelectors = options.selectors[key];
                break;
            }
        }

        var selectorCount = [], allSelectors = [];

        css.walkRules(function (rule) {

            var selectors = rule.selector.split(','),
                selectorsLength = selectors.length,
                parsedSelectors = [];

            for (var j = 0; j < selectorsLength; j++) {

                var selectorLine = selectors[j];

                allSelectors.push(selectorLine);

                for (var i = 0; i < editableSelectors.length; i++) {
                    var sel = editableSelectors[i].selector,
                        type = editableSelectors[i].type;

                    if (selectorLine.indexOf(`${sel} `) !== -1) {

                        if (type === 'remove') {
                            selectorLine = '';
                        } else if (type === 'convert') {
                            selectorLine = selectorLine.replace(`${sel} `, '');
                        } else if (type === 'keep') {
                            selectorLine = selectorLine.replace(`${sel} `, '');
                        }

                    }

                }

            }

            if (selectorLine !== '') {
                parsedSelectors.push(selectorLine);
                selectorCount.push(selectorLine);
            };

            if (parsedSelectors.length > 0) {
                rule.selector = parsedSelectors.join(',');
            } else {
                rule.remove();
            }

        });

        console.log(`Your ${options.cleanser} CSS uses ${selectorCount.length} selectors, from a total of ${allSelectors.length}`);

    }

});
