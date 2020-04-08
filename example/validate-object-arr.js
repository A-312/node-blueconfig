const blueconfig = require('blueconfig')

const LISTOFERRORS = require('blueconfig/lib/error.js').LISTOFERRORS

blueconfig.addFormat({
  name: 'Object[]',
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
})

const conf = blueconfig({
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
}).merge([{
  name: 'Germany',
  population: '83783942 persons'
},
{
  name: 'France',
  population: 65273511
},
{
  name: 'Italy',
  population: 60461826
}
], 'data')

conf.validate()

console.log(conf.getProperties())
