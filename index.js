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

function removeSpecifics(selectorsInFile, editableSelectors) {

    var selectorsInFileLength = selectorsInFile.length,
        parsedSelectors = [];

    for (var j = 0; j < selectorsInFileLength; j++) {

        var selectorLine = selectorsInFile[j];

        for (var i = 0; i < editableSelectors.length; i++) {

            var sel = editableSelectors[i].selector,
                type = editableSelectors[i].type;

            if (selectorLine.indexOf(`${sel}`) !== -1) {

                if (type === 'remove') {
                    selectorLine = '';
                } else if (type === 'convert') {
                    selectorLine = selectorLine.replace(`${sel} `, '');
                } else if (type === 'keep') {
                    selectorLine = selectorLine.replace(`${sel} `, '');
                }

            }

        }

        if (selectorLine !== '') {
            parsedSelectors.push(selectorLine);
        };

    }
    return parsedSelectors;
}

function keepSpecifics(selectorsInFile, editableSelectors) {

    var selectorsInFileLength = selectorsInFile.length,
        parsedSelectors = [];

    for (var i = 0; i < editableSelectors.length; i++) {

        var sel = editableSelectors[i];

        if (Object.prototype.toString.call(sel) === '[object Object]') {
            sel = sel.selector;
        }
        if (selectorsInFile.join('').indexOf(sel) !== -1) {

            for (var j = 0; j < selectorsInFileLength; j++) {

                var selectorLine = selectorsInFile[j];
                var re = /[:.\s]/;
                var reduced = selectorLine.split(`${sel}`),
                    redux = reduced.join(''),
                    matched = re.exec(redux);

                if (reduced.length !== 1) {

                    if (redux === '' || (matched !== null && matched.index === 0)) {
                        parsedSelectors.push(selectorLine);
                    }

                }

            }

        }

    }
    return parsedSelectors;

}

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse(options) {

    return function (css) {

        options = options || {};
        options.selectors = options.selectors || {};
        options.subset = options.subset || false;

        var selectormap = Object.assign({}, options.selectors, defaultselectors);

        if (typeof options.cleanser !== 'undefined') {
            var editableSelectors = selectormap[options.cleanser];
        } else {
            for (var key in options.selectors) {
                var editableSelectors = options.selectors[key];
                break;
            }
        }

        var selectorCount = 0, allSelectors = 0;

        css.walkRules(function (rule) {

            var selectorsInFile = rule.selector.replace(/(\r\n|\n|\r)/gm,'').split(','),
                selectorsInFileLength = selectorsInFile.length,
                parsedSelectors = [];

            /**
             * At the moment we skip atrules such as @keyframes & @font-face
             */
            if (rule.parent.type === 'atrule' && rule.parent.name !== 'media') {
                return;
            }

            if (options.subset === true) {
                parsedSelectors = keepSpecifics(selectorsInFile, editableSelectors);
            }

            if (options.subset === false) {
                parsedSelectors = removeSpecifics(selectorsInFile, editableSelectors);
            }

            allSelectors = allSelectors + selectorsInFileLength;

            if (parsedSelectors.length > 0) {
                selectorCount = selectorCount + parsedSelectors.length;
                rule.selector = parsedSelectors.join(',');
            } else {
                rule.remove();
            }

        });

        console.log(`Your ${options.cleanser} CSS uses ${selectorCount} selectors, from a total of ${allSelectors}`);

    }

});
