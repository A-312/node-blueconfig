# Blueconfig-format-with-validator

[![NPM version](http://img.shields.io/npm/v/blueconfig-format-with-validator.svg)](https://www.npmjs.org/package/blueconfig-format-with-validator)

Format 'email', 'ipaddress' and 'url' for blueconfig with validatorjs.

## Install

```shell
npm install blueconfig-format-with-validator
```

## Usage

An example `config.js` file:

```javascript
const blueconfig = require('blueconfig');

blueconfig.addFormats([
  require('blueconfig-format-with-validator').email,
  require('blueconfig-format-with-validator').ipaddress,
  require('blueconfig-format-with-validator').url
]);

// or :
// blueconfig.addFormats(require('blueconfig-format-with-validator'));

// Define a schema
var config = blueconfig({
  ip: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS',
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 8080,
    env: 'PORT',
    arg: 'port'
  },
  email: {
    doc: 'Server mail',
    format: 'email',
    default: 'foo@bar.com'
  },
  url: {
    doc: 'Server url',
    format: 'url',
    default: 'http://example.com'
  }
});
```

### Validation

This package uses [validator.js](https://github.com/chriso/node-validator#list-of-validation-methods) to validate:

* `email`
* `ipaddress` - IPv4 and IPv6 addresses
* `url`

### Coercion

Blueconfig will automatically coerce strings variables to their proper types when importing them.
