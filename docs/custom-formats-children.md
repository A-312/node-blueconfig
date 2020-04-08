This format allows to write one model for several similar children object.

```javascript
{
  "germany": {
    "name": "Germany",
    "population": 83783942,
    "subregion": "Europe"
  },
  "france": {
    "name": "France",
    "population": 65273511,
    "subregion": "Europe"
  },
  "italy": {
    "name": "Italy",
    "population": 60461826,
    "subregion": "Europe"
  }
}
```

```javascript
const blueconfig = require('blueconfig')

const LISTOFERRORS = require('blueconfig/lib/error.js').LISTOFERRORS

function isObjNotNull(obj) {
  return typeof obj === 'object' && obj !== null
}

blueconfig.addFormat({
  name: 'children',
  validate: function(children, schema, fullname) {
    const errors = []

    if (!isObjNotNull(children)) {
      throw new Error('must be an Object not null')
    }

    Object.keys(children).forEach((keyname) => {
      try {
        const conf = blueconfig(schema.children).merge(children[keyname]).validate()
        this.set(fullname, conf.getProperties())
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
  format: 'children',
  default: {},
  children: {
    // conf.{country-name}.xxx:
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
}).merge({
  germany: {
    name: 'Germany',
    population: '83783942 persons'
  },
  france: {
    name: 'France',
    population: 65273511
  },
  italy: {
    name: 'Italy',
    population: 60461826
  }
})

conf.validate()

console.log(conf.getProperties())
```