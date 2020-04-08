You can specify a custom format checking method on a property basis.

For example:

```javascript
const config = blueconfig({
  key: {
    doc: 'API key',
    format: function check(val, schema) {
      if (!/^[a-fA-F0-9]{64}$/.test(val)) {
        throw new Error('must be a 64 character hex key')
      }
    },
    default: '3cec609c9bc601c047af917a544645c50caf8cd606806b4e0a23312441014deb'
  },
  name: {
    doc: 'user name',
    format: function check(val, schema, fullname) {
      if (typeof val.first_name !== 'string') {
        throw new TypeError(`first name '${val.first_name}' is not a string`)
      }
      if (typeof val.last_name !== 'string') {
        throw new TypeError(`last name '${val.last_name}' is not a string`)
      }
    },
    default: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
})
```

Or, you can use `blueconfig.addFormat()` to register a custom format checking
method that can be reused for many different properties:

```javascript
blueconfig.addFormat({
  name: 'float-percent',
  validate: function(val, schema, fullname) {
    if (val !== 0 && (!val || val > 1 || val < 0)) {
      throw new Error('must be a float between 0 and 1, inclusive')
    }
  },
  coerce: function(val) {
    return parseFloat(val, 10)
  }
})

const config = blueconfig({
  space_used: {
    format: 'float-percent',
    default: 0.5
  },
  success_rate: {
    format: 'float-percent',
    default: 60.0
  }
})
```



