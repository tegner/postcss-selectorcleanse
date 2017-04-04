'use strict'

const { readFileSync } = require('fs')

var postcss = require('postcss')

var input = readFileSync('testing/input_css/input.css', 'utf8')
var plugin = require('./')

var env = process.argv[3] || 'smartphone'
var configFunc = require('./testing/config/config.js')
var config = configFunc(env)

function run (input, output, opts) {
  return postcss([ plugin(opts) ]).process(input)
      .then(result => {
        console.log('******************************* wanted output **********************************')
        console.log(output)
        console.log('*********************************** result **********************************')
        console.log(result.css)
        console.log('*********************************** match? **********************************')
        console.log(result.css === output)
      })
}

run(input, config.output, config.options)
