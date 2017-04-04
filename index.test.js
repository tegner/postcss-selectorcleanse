'use strict'

const { readFileSync } = require('fs')

var postcss = require('postcss')
var plugin = require('./')
var configFunc = require('./testing/config/config.js')

function run (input, output, opts) {
  return postcss([ plugin(opts) ]).process(input)
      .then(result => {
        expect(result.css).toEqual(output)
        expect(result.warnings().length).toBe(0)
      })
}

var input = readFileSync('testing/input_css/input.css', 'utf8')

/* Write tests here */
it('tests smartphone output', () => {
  var config = configFunc('smartphone')

  return run(input, config.output, config.options)
})

it('tests atf output', () => {
  var config = configFunc('atf')

  return run(input, config.output, config.options)
})

it('tests desktop output', () => {
  var config = configFunc('desktop')

  return run(input, config.output, config.options)
})

it('tests tablet output', () => {
  var config = configFunc('tablet')

  return run(input, config.output, config.options)
})
