const { readFileSync } = require('fs')

function pluginOptions (env) {
  switch (env) {
    case 'atf':
      return {
        'removeComments': true,
        'selectors': {
          'only': [ '.critical', '.atf' ],
          'convert': [ '.critical', '.atf' ],
          'remove': [ '.desktop', '.tablet' ]
        },
        'allowedMediaQuries': [
          '(--critical)'
        ],
        'translateMediaQuries': [
          {
            'query': '(--critical)',
            'selector': '.critical'
          }
        ]
      }
      break
    case 'desktop':
      return {
        'selectors': {
          'convert': [ '.desktop', '.critical', '.atf' ],
          'remove': [ '.smartphone', '.tablet' ]
        },
        'allowedMediaQuries': [
          '(--desktop)',
          '(--widedesktop)'
        ],
        'translateMediaQuries': [
          {
            'query': '(--desktop)',
            'selector': '.desktop'
          }
        ]
      }
      break
    case 'smartphone':
      return {
        'selectors': {
          'convert': [ '.smartphone' ],
          'remove': [
            '.desktop',
            '.tablet',
            '.critical',
            '.sec-rightcolumn',
            ':hover'
          ]
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
      }
      break
    case 'tablet':
      return {
        'selectors': {
          'convert': [
            '.tablet',
            '.critical',
            '.atf'
          ],
          'remove': [
            '.desktop',
            '.smartphone',
            ':hover'
          ]
        },
        'allowedMediaQuries': [
          '(--landscape)',
          '(--portrait)',
          '(--desktop)'
        ],
        'translateMediaQuries': [
          {
            'query': '(--desktop)',
            'selector': '.tablet'
          }
        ]
      }
      break
    default:
      return {
        'selectors': {
          'convert': [ '.smartphone' ],
          'remove': [
            '.desktop',
            '.tablet',
            '.atf',
            '.critical',
            '.sec-rightcolumn',
            ':hover'
          ]
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
      }
  }
}

function outputContent (env) {
  var fileName = `testing/output_css/${env}-output.css`
  return readFileSync(fileName, 'utf8')
}

module.exports = (env) => ({
  'options': pluginOptions(env),
  'output': outputContent(env)
})
