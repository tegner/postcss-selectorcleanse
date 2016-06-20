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
/**
 * removeSpecifics
 *
 */
function removeSpecifics(selectorsInFile, editableSelectors) {

    var selectorsInFileLength = selectorsInFile.length,
        parsedSelectors = [];

    for (let i = 0; i < selectorsInFileLength; i++) {

        var selectorLine = selectorsInFile[i];

        for (let j = 0; j < editableSelectors.length; j++) {

            var sel = editableSelectors[j].selector,
                type = editableSelectors[j].type;

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

/**
 * keepSpecifics
 * will remove anything but the specified classes from the options selectors
 * if class has parent, the parent needs to be specified, if the nested is to be keptKeyframes
 * TODO : remove classes with children or extensions, unless they are also specified
 */
function keepSpecifics(selectorsInFile, editableSelectors) {

    var selectorsInFileLength = selectorsInFile.length,
        parsedSelectors = [];

    for (let i = 0; i < editableSelectors.length; i++) {

        var sel = editableSelectors[i];

        if (Object.prototype.toString.call(sel) === '[object Object]') {
            sel = sel.selector;
        }
        var curIndexInSelector = selectorsInFile.join('').indexOf(sel);

        if (curIndexInSelector !== -1) {

            for (let j = 0; j < selectorsInFileLength; j++) {

                var selectorLine = selectorsInFile[j].trim(),
                    singleSelectorIndex = selectorLine.indexOf(sel),
                    re = /[:.\s]/,
                    reduced = selectorLine.split(`${sel}`),
                    redux = reduced.join(''),
                    matched = re.exec(redux);

                if (reduced.length !== 1) {
                    if (redux === '' || (matched !== null && matched.index === singleSelectorIndex)) {
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
            for (let key in options.selectors) {
                var editableSelectors = options.selectors[key];
                break;
            }
        }

        var selectorCount = 0, allSelectors = 0, regKeyframes = [], keptKeyframes = [];

        /** TODO : add media query cleaner
        css.walkAtRules("media", function(atrule) {
            if (atrule.params.replace(/\s/g, '') === "(max-width:767px)") {
                atrule.walkRules(function(rule) {
                    rule.selector = `.smartphone ${rule.selector}`;
                    rule.remove();
                    css.insertBefore(atrule, rule);
                });
            }
            atrule.remove();
        });*/
        css.walkRules(function (rule) {

            var selectorsInFile = rule.selector.replace(/(\r\n|\n|\r)/gm,'').split(','),
                selectorsInFileLength = selectorsInFile.length,
                parsedSelectors = [];

            /**
             * At the moment we skip atrules such as @keyframes & @font-face
             */
            if (rule.parent.type === 'atrule' && rule.parent.name !== 'media') {
                if (rule.parent.name.indexOf('keyframes') !== -1 && regKeyframes.indexOf(rule.parent.params) === -1) {
                    regKeyframes.push(rule.parent.params);
                }
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

        css.walkDecls('animation', function (decl) {
            var declValue = decl.value;
            for (let i = regKeyframes.length; i--;) {
                if (declValue.indexOf(regKeyframes[i]) !== -1) {
                    keptKeyframes.push(regKeyframes[i]);
                }
            }
        });

        if (options.atrules === false) {
          css.walkAtRules(function(ar) {
            ar.remove();
          });
        }

        if (options.atrules === false) {
          css.walkComments(function(comment) {
            comment.remove();
          });
        }

        for (let i = regKeyframes.length; i--;) {
            let curKeyframe = regKeyframes[i];
            if (keptKeyframes.indexOf(curKeyframe) === -1) {
                css.walkAtRules("keyframes", function(rule) {
                    if (rule.params === curKeyframe) {
                        rule.remove();
                    }
                });
            }
        }

        console.log(`Your CSS uses ${selectorCount} selectors, from a total of ${allSelectors}`);

    }

});
