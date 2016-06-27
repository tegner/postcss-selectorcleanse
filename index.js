'use strict'

/**
* Require dependencies
*/
var postcss = require('postcss')

/**
* Set default selectors
*/
var defaults = {
  "desktop": {
    "selectors": {
      "keep": [ ".desktop" ],
      "remove": [ ".smartphone", ".tablet" ]
    }
  },
  "smartphone": {
    "selectors": {
      "keep": [ ".smartphone" ],
      "remove": [".desktop", ".tablet", ":hover"]
    }
  },
  "tablet": {
    "selectors": {
      "keep": [ ".desktop", ".tablet" ],
      "remove": [".smartphone", ":hover"]
    }
  }
}

/**
* matchValueInObject
*
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
* removeSpecifics
*
*/
function removeSpecifics (selectorsInFile, editableSelectors) {
  var selectorsInFileLength = selectorsInFile.length
  var parsedSelectors = []

  for (let i = 0; i < selectorsInFileLength; i++) {
    var selectorLine = selectorsInFile[i]

    for (let j = 0; j < editableSelectors.length; j++) {
      var sel = editableSelectors[j].selector
      var type = editableSelectors[j].type
      if (selectorLine.indexOf(`${sel}`) !== -1) {
        if (type === 'remove') {
          selectorLine = ''
        } else if (type === 'convert') {
          selectorLine = selectorLine.replace(`${sel} `, '')
        } else if (type === 'keep') {
          selectorLine = selectorLine.replace(`${sel} `, '')
        }
      }
    }
    if (selectorLine !== '') {
      parsedSelectors.push(selectorLine)
    }
  }
  return parsedSelectors
}

/**
* keepSpecifics
* will remove anything but the specified classes from the options selectors
* if class has parent, the parent needs to be specified, if the nested is to be keptKeyframes
* TODO : remove classes with children or extensions, unless they are also specified
*/
function keepSpecifics (selectorsInFile, editableSelectors) {
  var selectorsInFileLength = selectorsInFile.length
  var parsedSelectors = []

  for (let i = 0; i < editableSelectors.length; i++) {
    var sel = editableSelectors[i]

    if (Object.prototype.toString.call(sel) === '[object Object]') {
      sel = sel.selector
    }
    var curIndexInSelector = selectorsInFile.join('').indexOf(sel)

    if (curIndexInSelector !== -1) {
      for (let j = 0; j < selectorsInFileLength; j++) {
        var selectorLine = selectorsInFile[j].trim()
        var singleSelectorIndex = selectorLine.indexOf(sel)
        var re = /[:.\s]/
        var reduced = selectorLine.split(`${sel}`)
        var redux = reduced.join('')
        var matched = re.exec(redux)

        if (reduced.length !== 1) {
          if (redux === '' || (matched !== null && matched.index === singleSelectorIndex)) {
            parsedSelectors.push(matched.input)
          }
        }
      }
    }
  }
  return parsedSelectors
}

module.exports = postcss.plugin('selectorcleanse', function selectorcleanse (options) {
  return function (css) {
    options = options || {}

    options.allowedMediaQuries = options.allowedMediaQuries || []
    options.translateMediaQuries = options.translateMediaQuries || []
    options.selectors = options.selectors || {}

    if (options.cleanser !== undefined) {
      options.selectors = defaults[options.cleanser].selectors
    }

    var allSelectors = 0
    var selectorCount = 0
    var regKeyframes = []
    var keptKeyframes = []

    if (options.allowedMediaQuries.length !== 0 || options.translateMediaQuries.length !== 0) {
      css.walkAtRules('media', function (atrule) {
        if (options.allowedMediaQuries.indexOf(atrule.params) === -1) {
          atrule.remove()
          console.warn(`WARNING! Your media query ${atrule.params} was removed from the CSS!`)
        }

        let returnedObject = matchValueInObjectArray(options.translateMediaQuries, atrule.params)
        if (returnedObject !== undefined) {
          atrule.walkRules(function (rule) {
            rule.selector = `${returnedObject.selector} ${rule.selector}`
            rule.remove()
            css.insertBefore(atrule, rule)
          })
          atrule.remove()
          console.log(`Your media query ${atrule.params} was translated to ${returnedObject.selector}`)
        }
      })
    }

    if (options.selectors !== undefined) {
      if (options.selectors.remove !== undefined) {
        var selRem = options.selectors.remove
        for (let i = selRem.length; i--;) {
          var selectorToRemove = selRem[i]
          var rgex = new RegExp(selectorToRemove, 'gi')
          css.walkRules(rgex, function (rule) {

            var cleanselector = []
            var selArr = rule.selector.split(/,\n/gi)
            for (let j = selArr.length; j--;) {
              var curSelArr = selArr[j]
              var shouldRemove = (selArr[j].indexOf(selectorToRemove) !== -1)
              if (shouldRemove === false) {
                for (let k = selRem.length; k--;) {
                  shouldRemove = (curSelArr.indexOf(selRem[k]) !== -1)
                }
              }
              if (shouldRemove === false) {
                cleanselector.push(curSelArr)
              }
            }
            if (cleanselector.length > 0) {
              rule.selector = cleanselector.join(',')
            } else {
              rule.remove();
            }
          })
        }
      }
      if (options.selectors.keep !== undefined) {
        var selKeep = options.selectors.keep
        css.walkRules(function (rule) {
            if (rule.parent.name === undefined) {
              var selectorsInFile = rule.selector.replace(/(\r\n|\n|\r)/gm, '').split(',')

              allSelectors = allSelectors + selectorsInFile.length

              var parsedSelectors = keepSpecifics(selectorsInFile, selKeep)

              if (parsedSelectors.length > 0) {
                selectorCount = selectorCount + parsedSelectors.length
                rule.selector = parsedSelectors.join(',')
              } else {
                rule.remove()
              }
            }
        })
      }
    }

    var keyframesPreserved = []
    css.walkAtRules('keyframes', function (kfRule) {
      var thisIsAKeeper = false
      css.walkDecls('animation', function (decl) {
        var declValue = decl.value
        if (declValue.indexOf(kfRule.params) !== -1) {
          thisIsAKeeper = true
        }
      })
      if (thisIsAKeeper === false) {
        kfRule.remove()
      }
    })

    if (options.removeComments === true) {
      css.walkComments(function (comment) {
        comment.remove()
      })
    }

    console.log(`Your CSS uses ${selectorCount} selectors, from a total of ${allSelectors}`)

  }
})
