## Config & blueconfig properties parsing

Config properties are property that you will use in your app, blueconfig properties are property that you will use in your schema to validate value (e.g.: `default`, `format`, `sensitive`, `env` or `arg`...).

Only two blueconfig properties are used to turn an object to a config properties:
  - `default`: Every setting *must* have a default value but can be omitted if `format` is defined and not an Object `{...}`. If you want to use `default` property name like a config property in your schema use `$~default`. `$~default` will be replaced by `default` during the schema parsing;
  - `format`: If `default` is not defined and format is not an Object `{...}`, the current object will turn to a config properties.

Also **magic parsing** will turn `keyname: [ notObject ]` to `keyname: { default: [ notObject ], format: [ keyname type ] }`. E.g:
```javascript
const config = blueconfig({
  keyname: 'str',
  zoo: {
    elephant: {
      doc: 'Elephant name',
      format: Array
    },
    format: {
      // magic parsing
      bird: 'everywhere'
    }
  }
})
// blueconfig will understand `config.getSchema()`:
({
  keyname: {
    default: 'str',
    format: String
  },
  zoo: {
    elephant: {
      doc: 'Elephant name',
      format: Array
    },
    format: {
      bird: {
        default: 'everywhere',
        format: String
      }
    }
  }
})
```

When you use schema parsing with `opt.strictParsing = true`, `default` and `format` will be required, **magic parsing** will be disabled. Blueconfig will throw an error if `default` and `format` properties are missing.

## Optional config property

By default, the config property will be ignored during the schema validation if its value is `undefined` and `schema.default` is `undefined`. If you want to not accept optional value and validate value in this case [`value === undefined and schema.default === default`], set `schema.required` to `true`.

```javascript
const config = blueconfig({
  options: { // optional
    format: String,
    default: undefined
  }, // if `options` stays `undefined`: will be not validate and not throw
  password: { // required
    format: String,
    required: true,
    default: undefined
  } // if `password` stays `undefined`: will be validate and throw
}).validate()
```


## Precedence order

When merging configuration values from different sources, Blueconfig follows precedence rules depending on the getters' order.
The default getters order, from lowest to highest:

```javascript
blueconfig.getGettersOrder()
// ['default', 'value', 'env', 'arg', 'force']
```

1. Use `default` property set in schema
2. **Value** used with:
    - `config.merge(file)` and `config.merge(json)`;
    - `config.set(name, value, false, true)`.
3. Use the environment variable (only used when `env` property is set in schema)
4. Use the commandline arguments (only used when `arg` property is set in schema)
5. **Force** used with:
    - With: `config.set(name, value, true)` (permanent);
    - With: `config.set(name, value)` (can be undo with `config.refreshGetters()`).

This order means that if schema defines parameter to be taken from an environment variable and environment variable is set then you cannot override it with `config.merge(file)` or `config.merge(json)`.

```javascript
process.env.PORT = 8080 // environment variable is set
const config = blueconfig({
  port: {
    default: 3000,
    env: 'PORT'
  }
})
config.merge({ port: 9000 })
console.log(config.get('port')) // still 8080 from env
```


## Overriding Environment variables and Command line arguments

Blueconfig allows to override Environment variables and Command-line arguments.
It can be helpful for testing purposes.

When creating a config object pass an object with two optional properties as the 2nd parameter:

- `env: Object` - this object will be used instead of `process.env`
- `args: Array<string>` - this array will be used instead of `process.argv`

```javascript
const config = blueconfig({
  // configuration schema
}, {
  env: {
    // Environment variables
  },
  args: [
    // Command line arguments
  ]
})
```
