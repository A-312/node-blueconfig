You can specify a custom format checking for array items:

```json
{
  "sources": [
    {
      "type": "git",
      "url": "https://github.com/A-312/node-blueconfig.git"
    },
    {
      "type": "git",
      "url": "https://github.com/github/hub.git"
    }
  ]
}
```

```javascript
blueconfig.addFormat({
  name: 'Object[]',
  validate: function(children, schema, fullname) {
    const errors = []

    if (!Array.isArray(children)) {
      throw new Error('must be an Array')
    }

    children.forEach((child, keyname) => {
      try {
        const conf = blueconfig(schema.children).merge(children[keyname]).validate()
        this.set(fullname + '.' + keyname, conf.getProperties())
      } catch (err) {
        err.parent = fullname + '.' + keyname
        errors.push(err)
      }
    })

    if (errors.length !== 0) {
      // Returns several error, instead of the first find.
      throw new LISTOFERRORS(errors)
    }
  }
})

blueconfig.addFormat(require('blueconfig-format-with-validator').url)

const schema = {
  sources: {
    doc: 'A collection of data sources.',
    format: 'Object[]',
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
}

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
}).validate()
```
