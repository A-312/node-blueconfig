const parseArgs = require('yargs-parser')

const Core = require('./core.js')

/* >> HACK TO KEEP THE SAME BEHAVIOR (= STATIC OBJECT) AND PREVENT BREAK CHANGE */
/* SORRY IF YOU HAVE HEART ATTACK WHILE YOU READING THIS LINE ;-) I had no choice in writing this… */

/*
 * @returns {Blueconfig}
 */
const Blueconfig = function(rawSchema, options) {
  return Blueconfig.init(rawSchema, options)
}

Core.prototype.initPerformer.call(Blueconfig)

Blueconfig.init = Core.prototype.init
Blueconfig.getGettersOrder = Core.prototype.getGettersOrder
Blueconfig.sortGetters = Core.prototype.sortGetters
Blueconfig.addGetter = Core.prototype.addGetter
Blueconfig.addGetters = Core.prototype.addGetters
Blueconfig.addFormat = Core.prototype.addFormat
Blueconfig.addFormats = Core.prototype.addFormats
Blueconfig.addParser = Core.prototype.addParser
/* << */

Blueconfig.addGetter('default', (value, schema, stopPropagation) => schema._cvtCoerce(value))
Blueconfig.sortGetters(['default', 'value']) // set default before value
Blueconfig.addGetter('env', function(value, schema, stopPropagation) {
  return schema._cvtCoerce(this.getEnv()[value])
})
Blueconfig.addGetter('arg', function(value, schema, stopPropagation) {
  const argv = parseArgs(this.getArgs(), {
    configuration: {
      'dot-notation': false
    }
  })
  return schema._cvtCoerce(argv[value])
}, true)

Blueconfig.addFormats(require('./format/standard-formats.js'))

module.exports = Blueconfig

