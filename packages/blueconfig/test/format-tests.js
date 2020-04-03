const chai = require('chai')
const expect = chai.expect

const validator = require('validator')

const new_require = require('./new_require.js')
const blueconfig = new_require('../')

describe('blueconfig formats', function() {
  let conf

  it('must init and parse a schema', function() {
    blueconfig.addFormat({
      name: 'float-percent',
      validate: function(val) {
        if (val !== 0 && (!val || val > 1 || val < 0)) {
          throw new Error('must be a float between 0 and 1, inclusive')
        }
      },
      coerce: function(val) {
        return parseFloat(val, 10)
      }
    })

    blueconfig.addFormats({
      prime: {
        validate: function(val) {
          function isPrime(n) {
            if (n <= 1) return false // zero and one are not prime
            for (let i = 2; i * i <= n; i++) {
              if (n % i === 0) return false
            }
            return true
          }
          if (!isPrime(val)) throw new Error('must be a prime number')
        },
        coerce: function(val) {
          return parseInt(val, 10)
        }
      },
      'hex-string': {
        validate: function(val) {
          if (/^[0-9a-fA-F]+$/.test(val)) {
            throw new Error('must be a hexidecimal string')
          }
        }
      }
    })

    conf = blueconfig({
      foo: {
        enum: {
          format: ['foo', 'bar'],
          default: 'foo'
        },
        port: {
          format: 'port',
          default: 8080
        },
        pipe: {
          format: 'windows_named_pipe',
          default: '\\\\.\\pipe\\test'
        },
        pipe_port: {
          format: 'port_or_windows_named_pipe',
          default: '\\\\.\\pipe\\pipe_port'
        },
        nat: {
          format: 'nat',
          default: 42
        },
        int: {
          format: 'int',
          default: -9
        },
        int2: {
          format: 'integer',
          default: 42
        },
        any: {
          format: '*',
          default: 'foo'
        },
        custom: {
          format: function(val) {
            if (!validator.isAlpha(val)) {
              throw new Error('expected alpha characters, got ' + val)
            }
          },
          default: 'abcd'
        },
        primeNumber: {
          format: 'prime',
          default: 17
        },
        percentNumber: {
          format: 'float-percent',
          default: 0.5
        },
        optional: {
          format: '*',
          default: undefined
        }
      }
    })
  })

  it('must throw with bad name', function() {
    expect(() => blueconfig.addFormat({ name: [], validate: () => {} })).to.throw('Schema name must be a string (current: "object").')
  })

  it('must add several formats with array', function() {
    const blueconfig = new_require('../')

    blueconfig.addFormats([
      { name: 'bird1', validate: () => {} },
      { name: 'bird2', validate: () => {} },
      { name: 'bird3', validate: () => {} }
    ])

    const conf = blueconfig({
      a: {
        format: 'bird1',
        default: 'ok'
      },
      b: {
        format: 'bird2',
        default: 'ok'
      },
      c: {
        format: 'bird3',
        default: 'ok'
      }
    })

    expect(() => conf.validate()).to.not.throw()
  })

  it('validates default schema', function() {
    expect(() => conf.validate()).to.not.throw()
  })

  it('validates non-coerced correct values', function() {
    conf.set('foo.primeNumber', 7)

    expect(() => conf.validate()).to.not.throw()
  })

  it('validates coerced correct values', function() {
    conf.set('foo.primeNumber', '11')

    expect(() => conf.validate()).to.not.throw()
  })

  it('successfully fails to validate incorrect values', function() {
    conf.set('foo.primeNumber', 16)
    expect(() => conf.validate()).to.throw('foo.primeNumber: must be a prime number: value was 16')
  })

  describe('predefined formats', function() {
    describe('port_or_windows_named_pipe', function() {
      const conf = blueconfig({
        port: {
          format: 'port_or_windows_named_pipe',
          default: '1234'
        },
        pipe: {
          format: 'port_or_windows_named_pipe',
          default: '\\\\.\\pipe\\test'
        },
        to_pipe: {
          format: 'port_or_windows_named_pipe',
          default: 1234
        },
        to_port: {
          format: 'port_or_windows_named_pipe',
          default: '\\\\.\\pipe\\default'
        }
      })

      it('must coerce ports to integers', function() {
        expect(conf.get('port')).to.equal(1234)
      })

      it('must not coerce pipes to integers', function() {
        expect(conf.get('pipe')).to.equal('\\\\.\\pipe\\test')
      })

      it('must handle switching from port to pipe', function() {
        conf.set('to_pipe', '\\\\.\\pipe\\changed')
        expect(conf.get('to_pipe')).to.equal('\\\\.\\pipe\\changed')
      })

      it('must handle switching from pipe to port', function() {
        // before change origin is default
        expect(conf.getOrigin('to_port')).to.equal('default')
        conf.set('to_port', '8080')
        // after change origin is value
        expect(conf.getOrigin('to_port')).to.equal('value')
        expect(conf.get('to_port')).to.equal(8080)
      })

      it('must throw for invalid ports', function() {
        const conf = blueconfig({
          invalid: {
            format: 'port_or_windows_named_pipe',
            default: '235235452355'
          }
        })

        expect(() => conf.validate()).to.throw('must be a windows named pipe or a number within rang')
      })

      it('must throw for invalid pipes', function() {
        const conf = blueconfig({
          invalid: {
            format: 'port_or_windows_named_pipe',
            default: '\\.pipe\\test'
          }
        })

        expect(() => conf.validate()).to.throw('must be a windows named pipe or a number within rang')
      })
    })
  })

  it('must throw with unknown format', function() {
    const schema = {
      foo: {
        format: 'unknown',
        default: 'bar'
      }
    }

    expect(() => blueconfig(schema)).to.throw('foo: uses an unknown format type (current: "unknown")')
  })

  it('must accept undefined as a default', function() {
    const val = conf.get('foo.optional')

    expect(val).to.be.undefined
  })

  describe('must return schema in second argument', function() {
    const schema = {
      sources: {
        doc: 'A collection of data sources.',
        format: 'source-array',
        default: [],

        children: {
          type: {
            doc: 'The source type',
            format: ['git', 'hg', 'svn'],
            default: null
          },
          url: {
            doc: 'The source URL',
            format: 'url',
            default: null
          }
        }
      }
    }

    const config = {
      sources: [
        {
          type: 'git',
          url: 'https://github.com/A-312/node-blueconfig.git'
        },
        {
          type: 'git',
          url: 'https://github.com/github/hub.git'
        }
      ]
    }

    const configWithError = {
      sources: [
        {
          type: 'git',
          url: 'https:/(è_é)/github.com/A-312/node-blueconfig.git'
        },
        {
          type: 'git',
          url: 'https://github.com/github/hub.git'
        }
      ]
    }

    it('must parse a config specification', function() {
      blueconfig.addFormat({
        name: 'source-array',
        validate: function(sources, schema) {
          if (!Array.isArray(sources)) {
            throw new Error('must be of type Array')
          }

          sources.forEach((source) => {
            blueconfig(schema.children).merge(source).validate()
          })
        }
      })
    })

    it('must add url format of blueconfig-format-with-validator', function() {
      blueconfig.addFormat(require('blueconfig-format-with-validator').url)
    })

    it('must validate children value without throw an Error', function() {
      expect(() => blueconfig(schema).merge(config).validate()).to.not.throw()
    })

    it('successfully fails to validate incorrect children values', function() {
      expect(() => blueconfig(schema).merge(configWithError).validate()).to.throw('url: must be a URL: value was "https:/(è_é)/github.com/A-312/node-blueconfig.git')
    })
  })
})
