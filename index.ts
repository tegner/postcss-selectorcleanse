import postcss = require('postcss');

interface IQueryTranslator {
  query: string;
  selector: string;
}

interface ISelectorsOptions {
  convert?: string[];
  only?: string[];
  remove?: string[];
}

interface ISelectorCleanseOptions {
  allowedMediaQuries?: string[];
  bannedMediaQuries?: string[];
  cleanser?: string;
  log?: boolean;
  removeComments?: boolean;
  translateMediaQuries?: IQueryTranslator[];
  selectors?: ISelectorsOptions;
}

interface ISelectorCleanseDefaults {
  [id: string]: ISelectorCleanseOptions;
}

/**
 * Set default selectors
 */
const defaults: ISelectorCleanseDefaults = {
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
const matchValueInObjectArray = (arr: IQueryTranslator[], matchValue: string) => {
  let valueMatched;
  for (let i = arr.length; i--; ) {
    const obj = arr[i];
    for (const key in obj) {
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
const createSubset = (selectorsInFile: string, regex: RegExp): string => {
  const cleanselector = [];
  const selectorsInFileArr = selectorsInFile.split(',');
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    const selector = selectorsInFileArr[i].replace(/\n|\r/gi, '');
    const result = regex.exec(selector);
    let pushvalue = '';
    if (result !== null) {
      const checkresult = selector.indexOf(result[0] + ' ') !== -1 || selector === result[0];
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
const convertSelector = (selectorsInFile: string, regex: RegExp) => {
  const cleanselector = [];
  const selectorsInFileArr = selectorsInFile.split(',');
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    let selector = selectorsInFileArr[i];
    const result = regex.exec(selector);
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
const removeSelector = (selectorsInFile: string, regex: RegExp) => {
  const cleanselector = [];
  const selectorsInFileArr = selectorsInFile.split(',');
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    const selector = selectorsInFileArr[i];
    const result = regex.exec(selector);
    if (result === null) {
      cleanselector.push(selector);
    }
  }
  return cleanselector.join(',');
};

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse(options: ISelectorCleanseOptions) {
  return function(css) {
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
      css.walkAtRules('media', (atrule: postcss.AtRule) => {
        if (options.bannedMediaQuries.indexOf(atrule.params) !== -1) {
          atrule.remove();
        }

        if (options.allowedMediaQuries.indexOf(atrule.params) === -1) {
          atrule.remove();
        }

        let returnedObject = matchValueInObjectArray(options.translateMediaQuries, atrule.params);
        if (returnedObject) {
          atrule.walkRules(function(rule) {
            rule.selector = `${returnedObject.selector} ${rule.selector}`;
            rule.remove();
            css.insertBefore(atrule, rule);
          });
          atrule.remove();
        }
      });
    }

    if (options.selectors) {
      if (options.selectors.only) {
        let selectorsToKeep = options.selectors.only;
        let onlyRegexString = selectorsToKeep.join('|\\') + '|\\:root';
        let onlyRegexWalk = new RegExp('^(?!\\' + onlyRegexString + ')');
        let onlyRegex = new RegExp('\\' + onlyRegexString);
        css.walkRules(onlyRegexWalk, (rule: postcss.Rule) => {
          if (!(rule.parent as postcss.AtRule).name) {
            let newSelector = createSubset(rule.selector, onlyRegex);
            if (newSelector !== '') {
              rule.selector = newSelector;
            } else {
              rule.remove();
            }
          }
        });
      }

      if (options.selectors.convert) {
        let selectorsToConvert = options.selectors.convert;
        let convertRegexString = selectorsToConvert.join('|\\');
        let convertRegex = new RegExp('\\' + convertRegexString);
        css.walkRules(convertRegex, (rule: postcss.Rule) => {
          rule.selector = convertSelector(rule.selector, convertRegex);
          let newSelector = convertSelector(rule.selector, convertRegex);
          if (newSelector !== '') {
            rule.selector = newSelector;
          } else {
            rule.remove();
          }
        });
      }
      if (options.selectors.remove) {
        let selectorsToRemove = options.selectors.remove;
        let removeRegexString = selectorsToRemove.join('|\\');
        let removeRegex = new RegExp('\\' + removeRegexString);
        css.walkRules(removeRegex, (rule: postcss.Rule) => {
          let newSelector = removeSelector(rule.selector, removeRegex);
          if (newSelector !== '') {
            rule.selector = newSelector;
          } else {
            rule.remove();
          }
        });
      }
    }

    if (options.removeComments === true) {
      css.walkComments((comment: postcss.Comment) => {
        comment.remove();
      });
    }
  };
});
