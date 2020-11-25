'use strict';

const { readFileSync } = require('fs');
const { exec } = require('child_process');

const postcss = require('postcss');
const plugin = require('./index.js');
const configFunc = require('./testing/config/config.js');
console.log('configFunc', configFunc);
const run = (input, output, opts) => {
  return postcss([plugin(opts)])
    .process(input)
    .then(result => {
      expect(result.css).toEqual(output);
      expect(result.warnings().length).toBe(0);
    });
};

const input = readFileSync('testing/input_css/input.css', 'utf8');

/* Write tests here */
it('tests smartphone output', () => {
  const config = configFunc('smartphone');

  return run(input, config.output, config.options);
});

it('tests desktop output', () => {
  const config = configFunc('desktop');

  return run(input, config.output, config.options);
});

it('tests tablet output', () => {
  const config = configFunc('tablet');

  return run(input, config.output, config.options);
});
