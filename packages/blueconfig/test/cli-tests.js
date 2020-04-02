
/* eslint no-sync: 0 */

const chai = require('chai')
const expect = chai.expect

const fs = require('fs')
const path = require('path')
const new_require = require('./new_require.js')

// This test finds its cases in /test/cases
const cases_dir_path = path.join(__dirname, 'cases')
const files = fs.readdirSync(cases_dir_path)

const tests = []
files.forEach(function(filename) {
  const match = /^([a-zA-Z_\-0-9]+)\.js$/.exec(filename)
  if (match) {
    // store test name
    tests.push(match[1])
  }
})

describe('CLI tests', function() {
  tests.forEach(function(name) {
    describe(name, function() {
      const output = {}

      const expectedOutput = (() => {
        if (files.indexOf(name + '.out.js') !== -1) {
          return require(path.join(cases_dir_path, name + '.out.js'))
        } else {
          const expected = fs.readFileSync(path.join(cases_dir_path, name + '.out')).toString()
          // EOL for new line and windows support:
          return expected.trim().split(require('os').EOL).join('\n')
        }
      })()

      const state = (typeof expectedOutput === 'string') ? 'throw' : 'not throw'
      let conf

      it('Blueconfig must ' + state, function() {
        function init() {
          const blueconfig = new_require('../')
          const settings = require(path.join(__dirname, 'cases', name + '.js'))

          if (settings.formats) {
            if (Array.isArray(settings.formats)) {
              settings.formats.forEach(function(formats) {
                blueconfig.addFormats(formats)
              })
            } else {
              blueconfig.addFormats(settings.formats)
            }
          }

          const opts = {}

          if (settings.env) {
            opts.env = settings.env
          }

          if (settings.argv) {
            opts.args = settings.argv
          }

          if (settings.strictParsing) {
            opts.strictParsing = true
          }

          conf = blueconfig(settings.conf, opts)
          if (settings.data) {
            if (Array.isArray(settings.data)) {
              settings.data.forEach((data) => conf.merge(data))
            } else {
              conf.merge(settings.data)
            }
          }
          conf.validate(settings.validate || {})
        }

        if (typeof expectedOutput === 'string') {
          output.error = true
          expect(function() {
            init()
          }).to.throw(expectedOutput)
        } else {
          expect(function() {
            init()
          }).to.not.throw()
        }
      })

      it('must return the expected configuration object', function() {
        if (!output.error) {
          expect(conf.get()).to.deep.equal(expectedOutput)
        }
      })

      it('stringify configuration object', function() {
        if (files.indexOf(name + '.string') !== -1) {
          const expected = JSON.parse(fs.readFileSync(path.join(cases_dir_path, name + '.string')))

          expect(JSON.parse(conf.toString())).to.deep.equal(expected)
        }
      })

      it('check schema', function() {
        if (files.indexOf(name + '.schema') !== -1) {
          const expected = JSON.parse(fs.readFileSync(path.join(cases_dir_path, name + '.schema')))

          expect(JSON.parse(conf.getSchemaString())).to.deep.equal(expected)
        }
      })
    })
  })
})
