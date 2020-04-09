# Why Blueconfig ?

 1) Merge several config in one;
 2) Support environmental variables and Command-line arguments;
 2) Validate your config with your schema;
 3) Customize your schema and your validation (with custom format, type and type converter);
 5) Use your own file format (JSON, JSON5, YAML, TOML, XML...); *(JSON5 allows comment)*
 6) Only 3 dependancies (Blueconfig 7.0 will have only 2 dependancies).

**Install:** `npm install blueconfig`

# Exemple

## Schema

```yml
# Schema <blueconfig.js.org>
# database.yml
db:
  name:
    # db.name
    format: 'String'
    default: ''
  password:
    # db.password
    format: 'String'
    sensitive: true
    required: true
    env: PWD
  host:
    # db.host (require https://www.npmjs.com/package/blueconfig-format-with-validator)
    format: 'ipaddress'
    default: '127.0.0.1'
  port:
    # db.port
    format: 'port'
    default: 80
    arg: 'port'
```

## Code

**config.js:**

```
const yaml = require('yaml')
const blueconfig = require('blueconfig')
const blueconfigValidatorFormat = require('blueconfig-format-with-validator')

// add format with validator ( https://www.npmjs.com/package/validator )
blueconfig.addFormat(blueconfigValidatorFormat.ipaddress)

// add YAML parser
blueconfig.addParser([
  { extension: ['yml', 'yaml'], parse: yaml.parse }
])

// prepare config with schema.yml (and debug entries: opts.env)
const config = blueconfig('schema.yml', {
  env: { PWD: 'football' } // opts.env: Replace process.env
})

// merge data
config.merge({ db: { name: 'example-db' } }, 'data')

// config.merge(['./config.yml', './prod.yml'], 'file')

// validate
config.validate()

module.exports = config // or config.getProperties()

console.log(config.toString())
// Debug output : { "db": { "name": "example-db", "password": "[Sensitive]", "host": "127.0.0.1", "port": 80 } }
```

**server.js:**
```javascript
const config = require('./config.js')

const db = require('db').connect(config.get('db.host'), config.get('db.port'), config.get('db.password'), function () {
  console.log('connected on ' + config.get('db.name'))
})
```


# Blueconfig properties

 - **Type information**: the `format` property specifies either a built-in blueconfig format (`ipaddress`, `port`, `int`, etc.) or it can be a function to check a custom format. During validation, if a format check fails it will be added to the error report.
 - **Default values**: Is a default value before this value will be overwritten by another getter. 
 - **Environmental variables**: If the variable specified by `env` has a value, it will overwrite the setting's default value. An environment variable may not be mapped to more than one setting.
 - **Command-line arguments**: If the command-line argument specified by `arg` is supplied, it will overwrite the setting's default value or the value derived from `env`.
 - **Sensitive values and secrets**: If `sensitive` is set to `true`, this value will be masked to `"[Sensitive]"` when `config.toString()` is called. This helps avoid disclosing secret keys when printing configuration at application start for debugging purposes.


# Schema parsing behavior

 - [Understand schema parsing behavior](./tutorial-schema-parsing-behavior.html)


# Coercion

Blueconfig will automatically coerce environmental variables from strings to their proper types when importing them.
For instance, values with the format `int`, `nat`, `port`, or `Number` will become numbers after a straight forward
`parseInt` or `parseFloat`.


# Validation

Often developpers use tools to detect mistake oversight (like `eslint`). Validate function do the same thing. In order to help detect misconfigurations, blueconfig allows you to define a format for each setting. By default, blueconfig checks if the value of the property has the same type (according to `Object.prototype.toString.call`) as the default value specified in the schema. You can define a custom format checking function in the schema by setting the `format` property.

Blueconfig provides several predefined formats for validation that you can use. Most of them are self-explanatory:

* `*` - any value is valid
* `int`
* `port`
* `windows_named_pipe`
* `port_or_windows_named_pipe`
* `nat` - positive integer (natural number)

You can find other format [here](https://www.npmjs.com/search?q=keywords:blueconfig-format).

If `format` is set to one of the built-in JavaScript constructors, `Object`, `Array`, `String`, `Number`, `RegExp`, or `Boolean`, validation will use Object.prototype.toString.call to check that the setting is the proper type.
