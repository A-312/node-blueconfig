## Adding support for additional filetypes 

Blueconfig is able to parse files with custom file types. E.g. with Yaml and JSON5 :

```javascript
blueconfig.addParser({ extension: ['yml', 'yaml'], parse: yaml.safeLoad })
blueconfig.addParser([
  { extension: 'json', parse: json5.parse }, // replace json5 by json
  { extension: ['yml', 'yaml'], parse: yaml.safeLoad }
])

const config = blueconfig({ ... })
config.merge('config.yml')
```

If no supported extension is detected, `merge` will fallback to using the
default json parser.

## Allow comments in JSON files

If you want to allow comments in your JSON file, use [JSON5](https://www.npmjs.com/package/json5).

```javascript
blueconfig.addParser({extension: 'json', parse: require('json5').parse})
```
