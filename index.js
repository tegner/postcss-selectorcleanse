'use strict'

/**
* Require dependencies
*/
var postcss = require('postcss')

/**
* Set default selectors
*/
var defaults = {
  'desktop': {
    'selectors': {
      'convert': [ '.desktop' ],
      'remove': [ '.smartphone', '.tablet' ]
    }
  },
  'smartphone': {
    'selectors': {
      'convert': [ '.smartphone' ],
      'remove': [ '.desktop', '.tablet', ':hover' ]
    }
  },
  'tablet': {
    'selectors': {
      'convert': [ '.desktop', '.tablet' ],
      'remove': [ '.smartphone', ':hover' ]
    }
  }
}

/**
* matchValueInObject
*/
function matchValueInObjectArray (arr, matchValue) {
  let valueMatched
  for (let i = arr.length; i--;) {
    let obj = arr[i]
    for (let key in obj) {
      if (obj[key] === matchValue) {
        valueMatched = obj
      }
    }
  }
  return valueMatched
}

/**
* createSubset
*/
function createSubset (selectorsInFile, regex) {
  let cleanselector = []
  let selectorsInFileArr = selectorsInFile.split(',')
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    let selector = selectorsInFileArr[i]
    let result = regex.exec(selector)
    let pushvalue = ''
    if (result !== null) {
      pushvalue = selector.replace(result[0], '').trim()
    }
    if (pushvalue !== '') {
      cleanselector.push(pushvalue)
    }
  }
  return cleanselector.join(',')
}

/**
* convertSelector
*/
function convertSelector (selectorsInFile, regex) {
  let cleanselector = []
  let selectorsInFileArr = selectorsInFile.split(',')
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    let selector = selectorsInFileArr[i]
    let result = regex.exec(selector)
    if (result !== null) {
      selector = selector.replace(result[0], '').trim()
    }
    cleanselector.push(selector)
  }
  return cleanselector.join(',')
}

/**
* removeSelector
*/
function removeSelector (selectorsInFile, regex) {
  let cleanselector = []
  let selectorsInFileArr = selectorsInFile.split(',')
  for (let i = 0; i < selectorsInFileArr.length; i++) {
    let selector = selectorsInFileArr[i]
    let result = regex.exec(selector)
    if (result === null) {
      cleanselector.push(selector)
    }
  }
  return cleanselector.join(',')
}

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse (options) {
  return function (css) {
    options = options || {}

    options.allowedMediaQuries = options.allowedMediaQuries || []
    options.translateMediaQuries = options.translateMediaQuries || []
    options.selectors = options.selectors || {}
    options.log = true
    if (options.cleanser !== undefined) {
      options.selectors = defaults[options.cleanser].selectors
    }

    if (options.allowedMediaQuries.length !== 0 || options.translateMediaQuries.length !== 0) {
      let removedAtRules = []
      let translatedAtRules = []
      css.walkAtRules('media', function (atrule) {
        if (options.allowedMediaQuries.indexOf(atrule.params) === -1) {
          atrule.remove()
          removedAtRules.push(atrule.params)
        }

        let returnedObject = matchValueInObjectArray(options.translateMediaQuries, atrule.params)
        if (returnedObject !== undefined) {
          atrule.walkRules(function (rule) {
            rule.selector = `${returnedObject.selector} ${rule.selector}`
            rule.remove()
            css.insertBefore(atrule, rule)
          })
          atrule.remove()
          translatedAtRules.push(atrule.params)
        }
      })
    }

    if (options.selectors !== undefined) {
      if (options.selectors.only !== undefined) {
        let selectorsToKeep = options.selectors.only
        let keepRegexString = selectorsToKeep.join('|')
        let keepRegexWalk = new RegExp('^(?!\\' + keepRegexString + ')')
        let keepRegex = new RegExp('\\' + keepRegexString)
        css.walkRules(keepRegexWalk, function (rule) {
          if (rule.parent.name === undefined) {
            let newSelector = createSubset(rule.selector, keepRegex)
            if (newSelector !== '') {
              rule.selector = newSelector
            } else {
              rule.remove()
            }
          }
        })
      }
      if (options.selectors.convert !== undefined) {
        let convertedSelectors = []
        let selectorsToConvert = options.selectors.convert
        let convertRegexString = selectorsToConvert.join('|')
        let convertRegex = new RegExp('\\' + convertRegexString)
        css.walkRules(convertRegex, function (rule) {
          rule.selector = convertSelector(rule.selector, convertRegex)
          convertedSelectors.push(rule.selector)
        })
      }
      if (options.selectors.remove !== undefined) {
        let removedSelectors = []
        let selectorsToRemove = options.selectors.remove
        let removeRegexString = selectorsToRemove.join('|')
        let removeRegex = new RegExp('\\' + removeRegexString)
        css.walkRules(removeRegex, function (rule) {
          let newSelector = removeSelector(rule.selector, removeRegex)
          removedSelectors.push(rule.selector)
          if (newSelector !== '') {
            rule.selector = newSelector
          } else {
            rule.remove()
          }
        })
      }
    }

    css.walkAtRules('keyframes', function (kfRule) {
      let keepKeyframe = false
      css.walkDecls('animation', function (decl) {
        let declValue = decl.value
        if (declValue.indexOf(kfRule.params) !== -1) {
          keepKeyframe = true
        }
      })
      if (keepKeyframe === false) {
        kfRule.remove()
      }
    })

    if (options.removeComments === true) {
      css.walkComments(function (comment) {
        comment.remove()
      })
    }
  }
})
