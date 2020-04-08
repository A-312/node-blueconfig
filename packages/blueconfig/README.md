# Blueconfig

[![NPM version](http://img.shields.io/npm/v/blueconfig.svg)](https://www.npmjs.org/package/blueconfig)
[![Build Status](https://travis-ci.com/A-312/node-blueconfig.svg?branch=master)](https://travis-ci.com/A-312/node-blueconfig)
[![Coverage Status](https://coveralls.io/repos/github/A-312/node-blueconfig/badge.svg?branch=master)](https://coveralls.io/github/A-312/node-blueconfig?branch=master)

Blueconfig is schema validator for your config files on production or development environment. Blueconfig merges configs and validates them depending of a pattern called *schema*. Configs can be an object or a file (json, yaml...).

Introducing a configuration schema, blueconfig gives project collaborators more **context** on each setting and enables **validation and early failures** for when configuration goes wrong.

*This is a fork of node-convict 5.x*


## Features

* **Load and merge**: configurations are loaded from disk or inline and automatically
    merged
* **Nested structure**: keys and values can be organized in a tree structure
* **Environmental variables**: values can be derived from environmental
    variables
* **Command-line arguments**: values can also be derived from command-line
    arguments
* **Validation**: configurations are validated against your schema (presence
    checking, type checking, custom checking), generating an error report with
    all errors that are found
* **Comments allowed**: schema and configuration files can be either in the
    JSON format or in the newer [JSON5](https://www.npmjs.com/package/json5)
    format, so comments are welcome
* **Configuration file additional types support**: custom file type support can
    be used for the configuration file


## Install

```shell
npm install blueconfig
```

## Usage

An example `config.js` file:

```javascript
const blueconfig = require('blueconfig');

blueconfig.addFormat(require('blueconfig-format-with-validator').ipaddress);

// Define a schema
const config = blueconfig({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  ip: {
    doc: 'The IP address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 8080,
    env: 'PORT',
    arg: 'port'
  },
  db: {
    host: {
      doc: 'Database host name/IP',
      format: '*',
      default: 'server1.dev.test'
    },
    name: {
      doc: 'Database name',
      format: String,
      default: 'users'
    }
  }
});

// Load environment dependent configuration
const env = config.get('env');
config.merge('./config/' + env + '.json');

// Perform validation
config.validate({allowed: 'strict'});

module.exports = config;
```

An example `server.js` file leveraging the `config.js` file above:

```javascript
const http = require('http');
const config = require('./config.js');

const server = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});

// Consume
server.listen(config.get('port'), config.get('ip'), function(x) {
  const addy = server.address();
  console.log('running on http://' + addy.address + ':' + addy.port);
});
```

To launch your example server, and set a port:

```shell
node ./server.js --port 8080
```

*Note*: Command-line arguments *must* be supplied with a double-hyphen prefix (e.g. `--arg`). Single-hypen prefixes (e.g. `-a`) are not supported at this time.


## The Schema

A configuration module, with its deep nested schema, could look like this:

config.js:
```javascript
const config = blueconfig({
  db: {
    name: {
      format: String,
      default: ''
    },
    synchro: {
      active: {
        format: 'Boolean',
        default: false
      },
      remote_url: {
        format: 'url',
        default: 'http://localhost:8080/'
      }
    }
  },
  secret: {
    doc: 'Secret used for session cookies and CSRF tokens',
    format: '*',
    default: '',
    sensitive: true
  }
});

config.merge(['./prod.json', './config.json']);
```

Each setting in the schema has the following possible properties, each aiding in the blueconfig's goal of being more robust and collaborator friendly.

### Blueconfig properties

 - **Type information**: the `format` property specifies either a built-in blueconfig format (`ipaddress`, `port`, `int`, etc.) or it can be a function to check a custom format. During validation, if a format check fails it will be added to the error report.
 - **Default values**: Is a default value before this value will be overwritten by another getter. 
 - **Environmental variables**: If the variable specified by `env` has a value, it will overwrite the setting's default value. An environment variable may not be mapped to more than one setting.
 - **Command-line arguments**: If the command-line argument specified by `arg` is supplied, it will overwrite the setting's default value or the value derived from `env`.
 - **Sensitive values and secrets**: If `sensitive` is set to `true`, this value will be masked to `"[Sensitive]"` when `config.toString()` is called. This helps avoid disclosing secret keys when printing configuration at application start for debugging purposes.

### Schema parsing behavior

#### Config & blueconfig properties parsing

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
});
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
});
```

When you use schema parsing with `opt.strictParsing = true`, `default` and `format` will be required, **magic parsing** will be disabled. Blueconfig will throw an error if `default` and `format` properties are missing.

#### Optional config property

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
}).validate();
```


### Validation

In order to help detect misconfigurations, blueconfig allows you to define a format for each setting. By default, blueconfig checks if the value of the property has the same type (according to `Object.prototype.toString.call`) as the default value specified in the schema. You can define a custom format checking function in the schema by setting the `format` property.

blueconfig provides several predefined formats for validation that you can use. Most of them are self-explanatory:

* `*` - any value is valid
* `int`
* `port`
* `windows_named_pipe`
* `port_or_windows_named_pipe`
* `nat` - positive integer (natural number)

You can find other format [here](https://www.npmjs.com/search?q=keywords:blueconfig-format).

If `format` is set to one of the built-in JavaScript constructors, `Object`, `Array`, `String`, `Number`, `RegExp`, or `Boolean`, validation will use Object.prototype.toString.call to check that the setting is the proper type.

#### Custom format checking

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
        throw new TypeError(`first name '${val.first_name}' is not a string`);
      }
      if (typeof val.last_name !== 'string') {
        throw new TypeError(`last name '${val.last_name}' is not a string`);
      }
    },
    default: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
});
```

Or, you can use `blueconfig.addFormat()` to register a custom format checking
method that can be reused for many different properties:

```javascript
blueconfig.addFormat({
  name: 'float-percent',
  validate: function(val, schema, fullname) {
    if (val !== 0 && (!val || val > 1 || val < 0)) {
      throw new Error('must be a float between 0 and 1, inclusive');
    }
  },
  coerce: function(val) {
    return parseFloat(val, 10);
  }
});

const config = blueconfig({
  space_used: {
    format: 'float-percent',
    default: 0.5
  },
  success_rate: {
    format: 'float-percent',
    default: 60.0
  }
});
```

The `coerce` function is optional.

##### Custom format for array items

You can specify a custom format checking for array items:

```javascript
blueconfig.addFormat({
  name: 'source-array',
  validate: function(sources, schema, fullname) {
    if (!Array.isArray(sources)) {
      throw new Error('must be of type Array');
    }

    for (source of sources) {
      blueconfig(schema.children).merge(source).validate();
    }
  }
});

blueconfig.addFormat(require('blueconfig-format-with-validator').url);

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
};

blueconfig(schema).merge({
  'sources': [
    {
      'type': 'git',
      'url': 'https://github.com/A-312/node-blueconfig.git'
    },
    {
      'type': 'git',
      'url': 'https://github.com/github/hub.git'
    }
  ]
}).validate();
```

### Coercion

Blueconfig will automatically coerce environmental variables from strings to their proper types when importing them.
For instance, values with the format `int`, `nat`, `port`, or `Number` will become numbers after a straight forward
`parseInt` or `parseFloat`.


### Precedence order

When merging configuration values from different sources, Blueconfig follows precedence rules depending on the getters' order.
The default getters order, from lowest to highest:

```javascript
blueconfig.getGettersOrder();
// ['default', 'value', 'env', 'arg', 'force']
```

1. Use `default` property set in schema
2. **Value** used with:
    - `config.merge(file)` and `config.merge(json)` ;
    - `config.set(name, value, false, true)`.
3. Use the environment variable (only used when `env` property is set in schema)
4. Use the commandline arguments (only used when `arg` property is set in schema)
5. **Force** used with:
    - With: `config.set(name, value, true)` (permanent) ;
    - With: `config.set(name, value)` (can be undo with `config.refreshGetters()`).

This order means that if schema defines parameter to be taken from an environment variable and environment variable is set then you cannot override it with `config.merge(file)` or `config.merge(json)`.

```javascript
process.env.PORT = 8080; // environment variable is set
const config = blueconfig({
  port: {
    default: 3000,
    env: 'PORT'
  }
});
config.merge({ port: 9000 });
console.log(config.get('port')); // still 8080 from env
```

### Overriding Environment variables and Command line arguments

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
});
```

### Configuration file additional types support

Blueconfig is able to parse files with custom file types during `merge`.
For this specify the corresponding parsers with the associated file extensions.

```javascript
blueconfig.addParser({ extension: 'toml', parse: toml.parse });
blueconfig.addParser({ extension: ['yml', 'yaml'], parse: yaml.safeLoad });
blueconfig.addParser([
  { extension: 'json', parse: JSON.parse },
  { extension: 'json5', parse: json5.parse },
  { extension: ['yml', 'yaml'], parse: yaml.safeLoad },
  { extension: 'toml', parse: toml.parse }
]);

const config = blueconfig({ ... });
config.merge('config.toml');
```

If no supported extension is detected, `merge` will fallback to using the
default json parser.

#### Allow comments in JSON files

If you want to allow comments in your JSON file, use [JSON5](https://www.npmjs.com/package/json5).

```javascript
blueconfig.addParser({extension: 'json', parse: require('json5').parse});
```
