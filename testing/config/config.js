const { readFileSync } = require('fs');

function pluginOptions(env) {
  switch (env) {
    case 'desktop':
      return {
        bannedMediaQuries: ['(--smartphone)', '(--tablet)'],
        selectors: {
          convert: ['.desktop', '.critical', '.atf'],
          remove: ['.smartphone', '.tablet']
        },
        translateMediaQuries: [
          {
            query: '(--desktop)',
            selector: '.desktop'
          }
        ]
      };
    case 'smartphone':
      return {
        bannedMediaQuries: ['(--desktop)', '(--tablet)', '(--widedesktop)'],
        selectors: {
          convert: ['.smartphone'],
          remove: ['.desktop', '.tablet', '.critical', '.sec-rightcolumn', ':hover']
        },
        translateMediaQuries: [
          {
            query: '(--smartphone)',
            selector: '.smartphone'
          }
        ]
      };
    case 'tablet':
      return {
        bannedMediaQuries: ['(--smartphone)', '(--widedesktop)'],
        selectors: {
          convert: ['.tablet', '.critical', '.atf'],
          remove: ['.desktop', '.smartphone', ':hover']
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
      };
  }
}

function outputContent(env) {
  var fileName = `testing/output_css/${env}-output.css`;
  return readFileSync(fileName, 'utf8');
}

module.exports = env => ({
  options: pluginOptions(env),
  output: outputContent(env)
});
