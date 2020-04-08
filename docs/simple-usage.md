An example `config.js` file:

```javascript
const blueconfig = require('blueconfig')

blueconfig.addFormat(require('blueconfig-format-with-validator').ipaddress)

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
})

// Load environment dependent configuration
const env = config.get('env')
config.merge('./config/' + env + '.json')

// Perform validation
config.validate({allowed: 'strict'})

module.exports = config
```
