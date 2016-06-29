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
      'remove': [ '.smartphone', '.tablet', '.critical' ]
    },
    'allowedMediaQuries': [
      '(--desktop)'
    ],
    'translateMediaQuries': [
      {
        'query': '(--desktop)',
        'selector': '.desktop'
      }
    ]
  },
  'smartphone': {
    'selectors': {
      'convert': [ '.smartphone' ],
      'remove': [ '.desktop', '.tablet', ':hover', '.critical' ]
    },
    'allowedMediaQuries': [
      '(--smartphone)'
    ],
    'translateMediaQuries': [
      {
        'query': '(--smartphone)',
        'selector': '.smartphone'
      }
    ]
  },
  'tablet': {
    'selectors': {
      'convert': [ '.desktop', '.tablet' ],
      'remove': [ '.smartphone', ':hover', '.critical' ]
    },
    'allowedMediaQuries': [
      '(--desktop)',
      '(--tablet)'
    ],
    'translateMediaQuries': [
      {
        'query': '(--desktop)',
        'selector': '.desktop'
      },
      {
        'query': '(--tablet)',
        'selector': '.tablet'
      }
    ]
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
    let selector = selectorsInFileArr[i].replace(/\n|\r/gi, '')
    let result = regex.exec(selector)
    let pushvalue = ''
    if (result !== null) {
      let checkresult = (selector.indexOf(result[0] + ' ') !== -1 || selector === result[0])
      if (checkresult) {
        pushvalue = selector
      }
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
      options = defaults[options.cleanser]
    }

    if (options.allowedMediaQuries.length !== 0 || options.translateMediaQuries.length !== 0) {
      css.walkAtRules('media', function (atrule) {
        if (options.allowedMediaQuries.indexOf(atrule.params) === -1) {
          atrule.remove()
        }

        let returnedObject = matchValueInObjectArray(options.translateMediaQuries, atrule.params)
        if (returnedObject !== undefined) {
          atrule.walkRules(function (rule) {
            console.log(rule.selector)
            rule.selector = `${returnedObject.selector} ${rule.selector}`
            rule.remove()
            css.insertBefore(atrule, rule)
          })
          atrule.remove()
        }
      })
    }

    if (options.selectors !== undefined) {
      if (options.selectors.only !== undefined) {
        let selectorsToKeep = options.selectors.only
        let onlyRegexString = selectorsToKeep.join('|')
        let onlyRegexWalk = new RegExp('^(?!\\' + onlyRegexString + ')')
        let onlyRegex = new RegExp('\\' + onlyRegexString)

        // css.walkRules(function (rule) {
        //   if (rule.parent.name === undefined) {
        //     console.log('running')
        //     let newSelector = createSubset(rule.selector, onlyRegex)
        //     if (newSelector !== '') {
        //       rule.selector = newSelector
        //     } else {
        //       rule.remove()
        //     }
        //   }
        // })

        css.walkRules(onlyRegexWalk, function (rule) {
          if (rule.parent.name === undefined) {
            let newSelector = createSubset(rule.selector, onlyRegex)
            if (newSelector !== '') {
              rule.selector = newSelector
            } else {
              rule.remove()
            }
          }
        })
      }
      if (options.selectors.convert !== undefined) {
        let selectorsToConvert = options.selectors.convert
        let convertRegexString = selectorsToConvert.join('|')
        let convertRegex = new RegExp('\\' + convertRegexString)
        css.walkRules(convertRegex, function (rule) {
          rule.selector = convertSelector(rule.selector, convertRegex)
          let newSelector = convertSelector(rule.selector, convertRegex)
          if (newSelector !== '') {
            rule.selector = newSelector
          } else {
            rule.remove()
          }
        })
      }
      if (options.selectors.remove !== undefined) {
        let selectorsToRemove = options.selectors.remove
        let removeRegexString = selectorsToRemove.join('|')
        let removeRegex = new RegExp('\\' + removeRegexString)
        css.walkRules(removeRegex, function (rule) {
          let newSelector = removeSelector(rule.selector, removeRegex)
          if (newSelector !== '') {
            rule.selector = newSelector
          } else {
            rule.remove()
          }
        })
      }
    }

    if (options.removeComments === true) {
      css.walkComments(function (comment) {
        comment.remove()
      })
    }
  }
})
