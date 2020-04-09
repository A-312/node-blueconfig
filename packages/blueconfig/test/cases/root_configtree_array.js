const blueconfig = require('blueconfig')
const LISTOFERRORS = require('blueconfig/lib/error.js').LISTOFERRORS

exports.formats = {
  'Object[]': {
    validate: function(children, schema, fullname) {
      const errors = []

      if (!Array.isArray(children)) {
        throw new Error('must be an Array')
      }

      children.forEach((child, keyname) => {
        try {
          const conf = blueconfig(schema.children).merge(children[keyname]).validate()
          this.set(fullname + '.' + keyname, conf.getProperties())
        } catch (err) {
          err.parent = fullname + '.' + keyname
          errors.push(err)
        }
      })

      if (errors.length !== 0) {
        throw new LISTOFERRORS(errors)
      }
    }
  }
}

exports.conf = {
  format: 'Object[]',
  default: [],
  children: {
    // conf[].xxx:
    name: {
      format: 'String',
      default: undefined,
      required: true
    },
    population: {
      format: 'int',
      default: 0
    },
    subregion: {
      format: 'String',
      default: 'Europe'
    }
  }
}

exports.dataType = 'data'
exports.data = [{
  name: 1,
  population: '83783942 persons',
  subregion: 'Western Europe'
},
{
  name: 'France',
  population: 65273511
},
{
  name: 'Italy',
  population: 60461826,
  subregion: 2
}]
