'use strict';

const { readFileSync, writeFileSync } = require('fs');

const postcss = require('postcss');

const input = readFileSync('testing/input_css/input.css', 'utf8');

const plugin = require('./');

const env = process.argv[3] || 'smartphone';
const configFunc = require('./testing/config/config.js');
const config = configFunc(env);

function run(input, output, opts) {
  return postcss([plugin(opts)])
    .process(input)
    .then(result => {
      // console.log('******************************* wanted output **********************************')
      // console.log(output)
      // console.log('*********************************** result **********************************')
      console.log(result.css);
      console.log('******************************** match? *******************************');
      console.log(result.css === output);
      writeFileSync(`./testing/output_css/${env}-output.test.css`, result.css);
    });
}

run(input, config.output, config.options);
