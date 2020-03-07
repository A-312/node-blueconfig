# Blueconfig

[![NPM version](http://img.shields.io/npm/v/blueconfig.svg)](https://www.npmjs.org/package/blueconfig)

*This is a fork of node-convict*

Blueconfig expands on the standard pattern of configuring node.js applications in a way that is more robust and accessible to collaborators, who may have less interest in digging through imperative code in order to inspect or modify settings. By introducing a configuration schema, blueconfig gives project collaborators more **context** on each setting and enables **validation and early failures** for when configuration goes wrong.


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
    format: function check(val, schema) {
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
  validate: function(val, schema) {
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
  validate: function(sources, schema) {
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

## API blueconfig (global)

Some functions are only global, like `addParser`, `addFormat`, `addGetter`, etc.

### blueconfig.addParser(parser)

 - **parser**: should be an `Object` or an `Array` containing a list of `Object`.

Adds new parsers for custom file extensions.
E.g.:
```javascript
// Allow comments in JSON file (with JSON5)
blueconfig.addParser({ extension: 'json5', parse: require('json5').parse });
```

### blueconfig.addFormat(format) or blueconfig.addFormat(name, validate, coerce[, rewrite = false])

Adds a new custom format, `format` is an object, see example below. `rewrite = true`
will let you rewrite an existing format.
E.g.:
```javascript
blueconfig.addFormat({
  name: 'float-percent',
  validate: function(val, validate) {
    if (val !== 0 && (!val || val > 1 || val < 0)) {
      throw new Error('must be a float between 0 and 1, inclusive');
    }
  },
  coerce: function(val) {
    return parseFloat(val, 10);
  }
});
```

### blueconfig.addFormats(formats)

Adds new custom formats, `formats` being an object whose keys are the new custom
format names, see example below.
E.g.:
```javascript
blueconfig.addFormats({
  prime: {
    validate: function(val) {
      function isPrime(n) {
        if (n <= 1) return false; // zero and one are not prime
        for (let i=2; i*i <= n; i++) {
          if (n % i === 0) return false;
        }
        return true;
      }
      if (!isPrime(val)) throw new Error('must be a prime number');
    },
    coerce: function(val) {
      return parseInt(val, 10);
    }
  },
  'hex-string': {
    validate: function(val) {
      if (/^[0-9a-fA-F]+$/.test(val)) {
        throw new Error('must be a hexidecimal string');
      }
    }
  }
});
```

### blueconfig.addGetter(getter) or blueconfig.addGetter(property, getter[, usedOnlyOnce = false, rewrite = false])

Adds a new custom getter, `getter` being an object, see example below. `rewrite = true`
will let you rewrite an existing getter.

The third argument of getter callback function lets catch `undefined` value. By default, blueconfig
will try to call each getter function to get a value (different of `undefined`), then `stopPropagation()`
stops the getter calling loop.
E.g.:
```javascript
blueconfig.addGetter({
  name: 'file',
  getter: (value, schema, stopPropagation) => fs.readFileSync(value, 'utf-8').toString(),
  usedOnlyOnce: true // use file only once
});

blueconfig.addGetter({
  property: 'accept-undefined',
  getter: (value, schema, stopPropagation) => {
    stopPropagation();
    return undefined;
  }
});
```

### blueconfig.addGetters(getters)

Adds new custom getter, `getter` being an object whose keys are the new custom
getter names.
E.g.:
```javascript
blueconfig.addGetters([
  /* example to rewrite 'env' getter: */
  { name: 'env', getter: (val) => schema._cvtCoerce(this.getEnv()[val]), usedOnlyOnce: false, rewrite: true },
  { name: 'getter2', getter: (val) => val }
]);
```

### blueconfig.getGettersOrder()

Returns array containing getter names sorted by priority (ascending order).
E.g.:
```javascript
blueconfig.getGettersOrder();
// ['default', 'value', 'env', 'arg', 'force']
```

Also see: [`config.getGettersOrder()`](#TEMP_LINK)

### blueconfig.sortGetters(newOrder)

Sort getter depending on array order, priority uses ascending order. You have
to sort getters before create configuration object instance (before `config = blueconfig({})`)
because global getters config is cloned to a local getters config. Also see:
[`config.refreshGetters()`](#TEMP_LINK)

E.g.:
```javascript
blueconfig.getGettersOrder();
// ['default', 'value', 'env', 'arg', 'force']

// two ways to do:
blueconfig.setGettersOrder(['default', 'value', 'arg', 'env', 'force']);
blueconfig.setGettersOrder(['default', 'value', 'arg', 'env']); // force is optional and must be the last one

blueconfig.getGettersOrder();
// ['default', 'value', 'arg', 'env', 'force']
```

Also see: [`config.sortGetters()`](#TEMP_LINK)


## API config instance (local, inherited configuration object)

Inherited config object created by `const config = blueconfig(schema)`.

### const config = blueconfig(schema[, opts])

`blueconfig()` takes a schema object or a path to a schema JSON file and returns a
blueconfig configuration object.

**opts:** Optional object:

  - **opts.env**: Override `process.env` if specified using an object `{'NODE_ENV': 'production'}`.
  - **opts.args**: Override `process.argv` if specified using an array `['--argname', 'value']` or
  a string `--argname value`.
  - **opts.defaultSubstitute**: Override `'$~default'`, this value will be replaced by `'default'`
  during the schema parsing.
  - **opts.strictParsing**: Throw an error if `default` or `format` properties are omitted.

The configuration object has an API for getting and setting values, described
below.

The global getter config will be cloned to local config. You must
[refresh getters configs](#config.refreshGetters_TEMP_LINK) if you apply global change
to local (configuration instance).

E.g.:
```javascript
const config = blueconfig({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  log_file_path: {
    'doc': 'Log file path',
    'format': String,
    'default': '/tmp/app.log'
  }
});

// or
config = blueconfig('/some/path/to/a/config-schema.json');
```

### config.get(name)

Returns the current value of the `name` property. `name` can use dot notation to reference nested values.
E.g.:
```javascript
config.get('db.host');
// or
config.get('db').host;
// also
config.get('db[0]');
// with dot:
config.get('db["www.airbus.com"]'); { 'db': { 'www.airbus.com': 'air company'} }
// in the first level
config.get("['foo.bar']"); // { 'foo.bar': 'baz' }
```

### config.getOrigin(name)

Returns the current getter name of the `name` value origin. `name` can use dot notation to reference nested values.
E.g.:
```javascript
config.getOrigin('db.host');
```

### config.getGettersOrder()

Local (configuration instance) version of : [`blueconfig.getGettersOrder()`](#TEMP_LINK)

### config.sortGetters(newOrder)

Local (configuration instance) version of : [`blueconfig.sortGetters()`](#TEMP_LINK)

Sort getter depending of array order, priority uses ascending order.

### config.refreshGetters()

Reclone global getters config to local getters config and update configuration object value depending
on new getters' order.

`value` set with `.merge()`/`.set()` will be replaced by schema/getter value depending
of Origin priority. (See: [`getter-tests.js#L304`](#TEMP_LINK))
E.g.:
```javascript
blueconfig.getGettersOrder();
// ['default', 'value', 'env', 'arg', 'force']

const conf = blueconfig(schema); // will clone: ['default', 'value', 'env', 'arg', 'force']

// two ways to do:
blueconfig.setGettersOrder(['value', 'default', 'arg', 'env', 'force']);

conf.getGettersOrder(); // ['default', 'value', 'env', 'arg', 'force']
blueconfig.getGettersOrder(); // ['value', 'default', 'arg', 'env', 'force']

conf.refreshGetters(); // refresh and apply global change to local

conf.getGettersOrder(); // ['value', 'default', 'arg', 'env', 'force']
```

### config.default(name)

Returns the default value of the `name` property. `name` can use dot notation to reference nested values.
E.g.:
```javascript
config.default('server.port');
```

### config.reset(name)

Resets a property to its default value as defined in the schema.
E.g.:
```javascript
config.reset('server.port');
```

### config.has(name)

Returns `true` if the property `name` is defined, or `false` otherwise.
E.g.:
```javascript
if (config.has('some.property')) {
  // Do something
}
```

### config.set(name, value[, priority = false, respectPriority = false])

Sets the value of `name` to value. `name` can use dot notation to reference
nested values, e.g. `"db.port"`. If objects in the chain don't yet exist,
they will be initialized to empty objects.

**priority**: Optional, can be a boolean or getter name (a string). You must
declare this property in the schema to use this option. `set` will change
the property getter origin depending on `priority` value:
 - `false`: priority set to `value`.
 - `true`: priority set to `force`, can be only changed if you do another
 `.set(name, value)`. Make sure that `.refreshGetters()` will not overwrite
 your value.
 - a `String`: must be a getter name (like: `default`, `env`, `arg`).

**respectPriority**: Optional, if this argument is `true` this function will change the value
only if `priority` is higher than or equal to the property getter origin.

E.g.:
```javascript
config.set('property.that.may.not.exist.yet', 'some value');
config.get('property.that.may.not.exist.yet');
// "some value"

config.set('color', 'green', true); // getter: 'force'
// .get('color') --> 'green'

config.set('color', 'orange', false, true); // getter: 'value' and respectPriority = true
// value will be not change because  ^^^^ respectPriority = true and value priority < force priority
// .get('color') --> 'green'

config.set('color', 'pink', false); // getter: 'value'
// value will change because respectPriority is not active.
// .get('color') --> 'pink'

config.set('color', 'green', true); // getter: 'force'
// .get('color') --> 'green'

config.merge({color: 'blue'}); // getter: 'value'
// value will not change because value priority < force priority
// .get('color') --> 'green'
```

### config.merge(object | file | Array[object | file])

Loads/merges a JavaScript object into `config`.
E.g.:
```javascript
config.merge({
  'env': 'test',
  'ip': '127.0.0.1',
  'port': 80
});
```

Merges one or multiple JSON configuration files into `config`.
```javascript
config.merge('./config/' + conf.get('env') + '.json');
```

Or, merging multiple files at once.
E.g.:
```javascript
// CONFIG_FILES=/path/to/production.json,/path/to/secrets.json,/path/to/sitespecific.json
config.merge(process.env.CONFIG_FILES.split(','));
```

### config.validate([options])

Validates `config` against the schema used to initialize it. All errors are
collected and thrown or displayed at once.

#### options :

1. `allowed`: Any properties specified in config files that are not declared in
   the schema will print a warning or throw an error depending on this setting:
   - `warn`: is the default behavior, will print a warning.
   - `strict`: will throw errors. This is to ensure that the schema and the config
     files are in sync.

2. `output`: You can replace the default output `console.log`
   by your own output function. You can use [debug module][debug] like this:
```javascript
config.validate({
  allowed: 'strict',
  output: require('debug')('blueconfig:validate:error');
})
```

[debug]: https://www.npmjs.com/package/debug

### config.getProperties()

Exports all the properties (that is the keys and their current values) as JSON.

### config.toString()

Exports all the properties (that is the keys and their current values) as a JSON
string, with sensitive values masked. Sensitive values are masked even if they
aren't set, to avoid revealing any information.

### config.getSchema(debug)

Exports the schema as JSON. When debug is true, returns data schema (copy of blueconfig storage).

### config.getSchemaString(debug)

Exports the schema as a JSON string. When debug is true, returns data schema (copy of blueconfig storage).

### config.getArgs()

The array of process arguments (not including the launcher and application file arguments). Defaults to process.argv unless an override is specified using the args key of the second (options) argument of the blueconfig function.

### config.getEnv()

The map of environment variables. Defaults to process.env unless an override is specified using the env key of the second argument (options) argument of the blueconfig function.

## API schema property

Schema property is accessible by the second argument of the callback of getter `getter(value, schema, stopPropagation)` and format `validate(value, schema)`.

### schema[`doc` || `default` || `format` || ...]

You will find the properties that you defined in your schema (like `doc`, `default`, `format`, etc...).

### schema.\_cvtGetOrigin()

Get the name of the getter which gets the current value. 

### schema.\_cvtValidateFormat(value)

Calls the validate format function corresponding to `schema.format`, used by `config.validate(value)` to validate your schema. This function will throw an error if `value` doesn't have the correct format.

### schema.\_cvtCoerce(value)

Calls the `coerce` function corresponding to `schema.format`, used by getters to convert (generally a string) to its proper type (int, float, array...).

## FAQ

### How can I use blueconfig in a (browserify-based) browser context?

Thanks to [browserify](http://browserify.org/), `blueconfig` can be used for web applications too. To do so,

* Use [`brfs`](https://www.npmjs.com/package/brfs) to ensure the `fs.loadFileSync` schema-loading calls are inlined at build time rather than resolved at runtime (in Gulp, add `.transform(brfs)` to your browserify pipe).
* To support *"loading configuration from a `http://foo.bar/some.json` URL"*, build a thin wrapper around blueconfig using your favorite http package (e.g. [`superagent`](https://visionmedia.github.io/superagent/)). Typically, in the success callback, call blueconfig's `merge()` on the body of the response.


## Contributing

Read the [Contributing](./CONTRIBUTING.md) doc.
