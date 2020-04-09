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

module.exports = config.getProperties()

console.log(config.toString())
