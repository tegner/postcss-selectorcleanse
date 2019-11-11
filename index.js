"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var postcss = require("postcss");
/**
 * Set default selectors
 */
var defaults = {
    desktop: {
        bannedMediaQuries: ['(--smartphone)', '(--tablet)'],
        selectors: {
            convert: ['.desktop'],
            remove: ['.smartphone', '.tablet', '.critical']
        },
        translateMediaQuries: [
            {
                query: '(--desktop)',
                selector: '.desktop'
            }
        ]
    },
    smartphone: {
        bannedMediaQuries: ['(--desktop)', '(--tablet)'],
        selectors: {
            convert: ['.smartphone'],
            remove: ['.desktop', '.tablet', ':hover', '.critical']
        },
        translateMediaQuries: [
            {
                query: '(--smartphone)',
                selector: '.smartphone'
            }
        ]
    },
    tablet: {
        bannedMediaQuries: ['(--smartphone)'],
        selectors: {
            convert: ['.desktop', '.tablet'],
            remove: ['.smartphone', ':hover', '.critical']
        },
        translateMediaQuries: [
            {
                query: '(--desktop)',
                selector: '.tablet'
            },
            {
                query: '(--tablet)',
                selector: '.tablet'
            }
        ]
    }
};
/**
 * matchValueInObject
 */
var matchValueInObjectArray = function (arr, matchValue) {
    var valueMatched;
    for (var i = arr.length; i--;) {
        var obj = arr[i];
        for (var key in obj) {
            if (obj[key] === matchValue) {
                valueMatched = obj;
            }
        }
    }
    return valueMatched;
};
/**
 * createSubset
 */
var createSubset = function (selectorsInFile, regex) {
    var cleanselector = [];
    var selectorsInFileArr = selectorsInFile.split(',');
    for (var i = 0; i < selectorsInFileArr.length; i++) {
        var selector = selectorsInFileArr[i].replace(/\n|\r/gi, '');
        var result = regex.exec(selector);
        var pushvalue = '';
        if (result !== null) {
            var checkresult = selector.indexOf(result[0] + ' ') !== -1 || selector === result[0];
            if (checkresult) {
                pushvalue = selector;
            }
        }
        if (pushvalue !== '') {
            cleanselector.push(pushvalue);
        }
    }
    return cleanselector.join(',');
};
/**
 * convertSelector
 */
var convertSelector = function (selectorsInFile, regex) {
    var cleanselector = [];
    var selectorsInFileArr = selectorsInFile.split(',');
    for (var i = 0; i < selectorsInFileArr.length; i++) {
        var selector = selectorsInFileArr[i];
        var result = regex.exec(selector);
        if (result !== null) {
            selector = selector.replace(result[0], '').trim();
        }
        cleanselector.push(selector);
    }
    return cleanselector.join(',');
};
/**
 * removeSelector
 */
var removeSelector = function (selectorsInFile, regex) {
    var cleanselector = [];
    var selectorsInFileArr = selectorsInFile.split(',');
    for (var i = 0; i < selectorsInFileArr.length; i++) {
        var selector = selectorsInFileArr[i];
        var result = regex.exec(selector);
        if (result === null) {
            cleanselector.push(selector);
        }
    }
    return cleanselector.join(',');
};
module.exports = postcss.plugin('selectorcleanse', function selectorcleanse(options) {
    return function (css) {
        options = options || {};
        options.allowedMediaQuries = options.allowedMediaQuries || [];
        options.bannedMediaQuries = options.bannedMediaQuries || [];
        options.translateMediaQuries = options.translateMediaQuries || [];
        options.selectors = options.selectors || {};
        options.log = true;
        if (options.cleanser) {
            options = defaults[options.cleanser];
        }
        if (options.allowedMediaQuries.length !== 0 || options.translateMediaQuries.length !== 0) {
            css.walkAtRules('media', function (atrule) {
                if (options.bannedMediaQuries.indexOf(atrule.params) !== -1) {
                    atrule.remove();
                }
                if (options.allowedMediaQuries.indexOf(atrule.params) === -1) {
                    atrule.remove();
                }
                var returnedObject = matchValueInObjectArray(options.translateMediaQuries, atrule.params);
                if (returnedObject) {
                    atrule.walkRules(function (rule) {
                        rule.selector = returnedObject.selector + " " + rule.selector;
                        rule.remove();
                        css.insertBefore(atrule, rule);
                    });
                    atrule.remove();
                }
            });
        }
        if (options.selectors) {
            if (options.selectors.only) {
                var selectorsToKeep = options.selectors.only;
                var onlyRegexString = selectorsToKeep.join('|\\') + '|\\:root';
                var onlyRegexWalk = new RegExp('^(?!\\' + onlyRegexString + ')');
                var onlyRegex_1 = new RegExp('\\' + onlyRegexString);
                css.walkRules(onlyRegexWalk, function (rule) {
                    if (!rule.parent.name) {
                        var newSelector = createSubset(rule.selector, onlyRegex_1);
                        if (newSelector !== '') {
                            rule.selector = newSelector;
                        }
                        else {
                            rule.remove();
                        }
                    }
                });
            }
            if (options.selectors.convert) {
                var selectorsToConvert = options.selectors.convert;
                var convertRegexString = selectorsToConvert.join('|\\');
                var convertRegex_1 = new RegExp('\\' + convertRegexString);
                css.walkRules(convertRegex_1, function (rule) {
                    rule.selector = convertSelector(rule.selector, convertRegex_1);
                    var newSelector = convertSelector(rule.selector, convertRegex_1);
                    if (newSelector !== '') {
                        rule.selector = newSelector;
                    }
                    else {
                        rule.remove();
                    }
                });
            }
            if (options.selectors.remove) {
                var selectorsToRemove = options.selectors.remove;
                var removeRegexString = selectorsToRemove.join('|\\');
                var removeRegex_1 = new RegExp('\\' + removeRegexString);
                css.walkRules(removeRegex_1, function (rule) {
                    var newSelector = removeSelector(rule.selector, removeRegex_1);
                    if (newSelector !== '') {
                        rule.selector = newSelector;
                    }
                    else {
                        rule.remove();
                    }
                });
            }
        }
        if (options.removeComments === true) {
            css.walkComments(function (comment) {
                comment.remove();
            });
        }
    };
});
