const fs = require('fs')

const cloneDeep = require('lodash.clonedeep')

const parsePath = require('objectpath').parse
const stringifyPath = require('objectpath').stringify

const Apply = require('./apply.js')
const validator = require('./validator.js')

let Getter
let Parser

const utils = require('./utils.js')
const walk = utils.walk
const unroot = utils.unroot
const isObjNotNull = utils.isObjNotNull

const ALLOWED_OPTION_STRICT = 'strict'
const ALLOWED_OPTION_WARN = 'warn'

const cvtError = require('../error.js')

const BLUECONFIG_ERROR = cvtError.BLUECONFIG_ERROR
const LISTOFERRORS = cvtError.LISTOFERRORS
// 1
const SCHEMA_INVALID = cvtError.SCHEMA_INVALID
// 2
const CUSTOMISE_FAILED = cvtError.CUSTOMISE_FAILED
const INCORRECT_USAGE = cvtError.INCORRECT_USAGE
// 2
const VALUE_INVALID = cvtError.VALUE_INVALID
const VALIDATE_FAILED = cvtError.VALIDATE_FAILED
const FORMAT_INVALID = cvtError.FORMAT_INVALID

/**
 * Class for configNode, created with blueprint class.
 *
 * @class
 */
function ConfigObjectModel(rawSchema, options, scope) {
  this.options = options

  Getter = scope.Getter
  Parser = scope.Parser
  const parsingSchema = scope.parsingSchema

  this._strictParsing = !!(options && options.strictParsing)
  // The key `$~default` will be replaced by `default` during the schema parsing that allow
  // to use default key for config properties.
  const optsDefSub = (options) ? options.defaultSubstitute : false
  this._defaultSubstitute = (typeof optsDefSub !== 'string') ? '$~default' : optsDefSub

  // If the definition is a string treat it as an external schema file
  if (typeof rawSchema === 'string') {
    rawSchema = parseFile(rawSchema)
  }

  rawSchema = {
    root: rawSchema
  }

  // build up current config from definition
  this._schema = {
    _cvtProperties: {
      // root key lets apply format on the config root tree
      // root: { _cvtProperties: {} }
    }
  }

  this._getterAlreadyUsed = {}
  this._sensitive = new Set()

  // inheritance (own getter)
  this._getters = cloneDeep(Getter.storage)

  Object.keys(rawSchema).forEach((key) => {
    parsingSchema.call(this, key, rawSchema[key], this._schema._cvtProperties, key)
  })

  this._schemaRoot = this._schema._cvtProperties.root

  // config instance
  this._instance = {}

  Apply.getters.call(this, this._schema, this._instance)
}


module.exports = ConfigObjectModel







/////////////////////////////////////////////////////////------------------------------------
/**
 * Parse constructor arguments.
 */
ConfigObjectModel.prototype.getArgs = function() {
  return (this.options && this.options.args) || process.argv.slice(2)
}

/**
 * Gets the environment variable map, using the override passed to the
 * blueconfig function or process.env if no override was passed.
 */
ConfigObjectModel.prototype.getEnv = function() {
  return (this.options && this.options.env) || process.env
}
/////////////////////////////////////////////////////////------------------------------------











/**
 * Exports all the properties (that is the keys and their current values) as JSON
 */
ConfigObjectModel.prototype.getProperties = function() {
  return cloneDeep(this._instance.root)
}


/**
 * Exports all the properties (that is the keys and their current values) as
 * a JSON string, with sensitive values masked. Sensitive values are masked
 * even if they aren't set, to avoid revealing any information.
 */
ConfigObjectModel.prototype.toString = function() {
  const clone = cloneDeep(this._instance.root)
  this._sensitive.forEach(function(fullpath) {
    const path = parsePath(unroot(fullpath))
    const childKey = path.pop()
    const parentKey = stringifyPath(path)
    const parent = walk(clone, parentKey)
    parent[childKey] = '[Sensitive]'
  })
  return JSON.stringify(clone, null, 2)
}


/**
 * Exports the schema as JSON.
 */
ConfigObjectModel.prototype.getSchema = function(debug) {
  const schema = cloneDeep(this._schemaRoot)

  return (debug) ? cloneDeep(schema) : convertSchema.call(this, schema)
}

function convertSchema(nodeSchema, blueconfigProperties) {
  if (!nodeSchema || typeof nodeSchema !== 'object' || Array.isArray(nodeSchema)) {
    return nodeSchema
  } else if (nodeSchema._cvtProperties) {
    return convertSchema.call(this, nodeSchema._cvtProperties, true)
  } else {
    const schema = Array.isArray(nodeSchema) ? [] : {}

    Object.keys(nodeSchema).forEach((name) => {
      let keyname = name
      if (typeof nodeSchema[name] === 'function') {
        return
      } else if (name === 'default' && blueconfigProperties) {
        keyname = this._defaultSubstitute
      }

      schema[keyname] = convertSchema.call(this, nodeSchema[name])
    })

    return schema
  }
}


/**
 * Exports the schema as a JSON string
 */
ConfigObjectModel.prototype.getSchemaString = function(debug) {
  return JSON.stringify(this.getSchema(debug), null, 2)
}


/**
 * @returns Returns the current value of the name property. name can use dot
 *     notation to reference nested values
 */
ConfigObjectModel.prototype.get = function(path) {
  const o = walk(this._instance.root, path)
  return cloneDeep(o)
}


/**
 * @returns Returns the current getter name of the name value origin. name can use dot
 *     notation to reference nested values
 */
ConfigObjectModel.prototype.getOrigin = function(path) {
  path = pathToSchemaPath(path, '_cvtGetOrigin')
  const o = walk(this._schemaRoot._cvtProperties, path)
  return o ? o() : null
}


function pathToSchemaPath(path, addKey) {
  const schemaPath = []

  path = parsePath(path)
  path.forEach((property) => {
    schemaPath.push(property)
    schemaPath.push('_cvtProperties')
  })
  schemaPath.splice(-1)

  if (addKey) { schemaPath.push(addKey) }

  return schemaPath
}


/**
 * Gets array with getter name in the current order of priority
 */
ConfigObjectModel.prototype.getGettersOrder = function(path) {
  return cloneDeep(this._getters.order)
}


/**
 * sorts getters
 */
ConfigObjectModel.prototype.sortGetters = function(newOrder) {
  const sortFilter = Getter.sortGetters(this._getters.order, newOrder)

  this._getters.order.sort(sortFilter)
}


/**
 * Update local getters config with global config
 */
ConfigObjectModel.prototype.refreshGetters = function() {
  this._getters = cloneDeep(Getter.storage)

  Apply.getters.call(this, this._schema, this._instance)
}


/**
 * @returns Returns the default value of the name property. name can use dot
 *     notation to reference nested values
 */
ConfigObjectModel.prototype.default = function(path) {
  // The default value for FOO.BAR.BAZ is stored in `_schema._cvtProperties` at:
  //   FOO._cvtProperties.BAR._cvtProperties.BAZ.default
  path = pathToSchemaPath(path, 'default')
  const o = walk(this._schemaRoot._cvtProperties, path)
  return cloneDeep(o)
}


/**
 * Resets a property to its default value as defined in the schema
 */
ConfigObjectModel.prototype.reset = function(prop_name) {
  this.set(prop_name, this.default(prop_name), 'default', false)
}


/**
 * @returns Returns true if the property name is defined, or false otherwise
 */
ConfigObjectModel.prototype.has = function(path) {
  try {
    const r = this.get(path)
    const isRequired = (() => {
      try {
        return !!walk(this._schemaRoot._cvtProperties, pathToSchemaPath(path, 'required'))
      } catch (e) {
        // undeclared property
        return false
      }
    })()
    // values that are set and required = false but undefined return false
    return isRequired || typeof r !== 'undefined'
  } catch (e) {
    return false
  }
}


/**
 * Sets the value of name to value. name can use dot notation to reference
 * nested values, e.g. "database.port". If objects in the chain don't yet
 * exist, they will be initialized to empty objects
 */
ConfigObjectModel.prototype.set = function(fullpath, value, priority, respectPriority) {
  const mySchema = traverseSchema(this._schemaRoot, fullpath)

  if (!priority) {
    priority = 'value'
  } else if (typeof priority !== 'string') {
    priority = 'force'
  } else if (!this._getters.list[priority] && !['value', 'force'].includes(priority)) {
    throw new INCORRECT_USAGE('unknown getter: ' + priority)
  } else if (!mySchema) { // no schema and custom priority = impossible
    const errorMsg = 'you cannot set priority because "' + fullpath + '" not declared in the schema'
    throw new INCORRECT_USAGE(errorMsg)
  }

  // coercing
  const coerce = (mySchema && mySchema._cvtCoerce) ? mySchema._cvtCoerce : (v) => v
  value = coerce(value)
  // walk to the value
  const path = parsePath(fullpath)
  const childKey = path.pop()
  const parentKey = stringifyPath(path)
  const parent = walk(this._instance.root, parentKey, true)

  // respect priority
  const canIChangeValue = (() => {
    if (!respectPriority) { // -> false or not declared -> always change
      return true
    }

    const gettersOrder = this._getters.order

    const bool = mySchema && mySchema._cvtGetOrigin
    const lastG = bool && mySchema._cvtGetOrigin()

    if (lastG && gettersOrder.indexOf(priority) < gettersOrder.indexOf(lastG)) {
      return false
    }

    return true
  })()

  // change the value
  if (canIChangeValue) {
    parent[childKey] = value
    if (mySchema) {
      mySchema._cvtGetOrigin = () => priority
    }
  }

  return this
}


/**
 * Get the selected property for COM.set(...)
 */
function traverseSchema(schema, path) {
  const ar = parsePath(path)
  let o = schema
  while (ar.length > 0) {
    const k = ar.shift()
    if (o && o._cvtProperties && o._cvtProperties[k]) {
      o = o._cvtProperties[k]
    } else {
      o = null
      break
    }
  }

  return o
}


/**
 * Merges a JavaScript object into config
 *
 * @deprecated since v6.0.0, use `.merge(obj)` instead
 */
ConfigObjectModel.prototype.load = function(obj) {
  Apply.values.call(this, { root: obj }, this._instance, this._schema)

  return this
}


/**
 * Merges a JavaScript properties files into config
 *
 * @deprecated since v6.0.0, use `.merge(filepath|filepath[])` instead
 */
ConfigObjectModel.prototype.loadFile = function(paths) {
  if (!Array.isArray(paths)) paths = [paths]
  paths.forEach((path) => {
    // Support empty config files #253
    const json = parseFile(path)
    if (json) {
      this.load(json)
    }
  })
  return this
}

function parseFile(path) {
  const segments = path.split('.')
  const extension = segments.length > 1 ? segments.pop() : ''

  // TODO: Get rid of the sync call
  // eslint-disable-next-line no-sync
  return Parser.parse(extension, fs.readFileSync(path, 'utf-8'))
}

/**
 * Merges a JavaScript object/files into config
 *
 * @params   {Object|string|string[]}   sources    Configs will be merged
 */
ConfigObjectModel.prototype.merge = function(sources) {
  if (!Array.isArray(sources)) sources = [sources]
  sources.forEach((config) => {
    if (typeof config === 'string') {
      const json = parseFile(config)
      if (json) {
        this.load(json)
      }
    } else {
      this.load(config)
    }
  })
  return this
}


/**
 * Validates config against the schema used to initialize it
 */
ConfigObjectModel.prototype.validate = function(options) {
  options = options || {}

  options.allowed = options.allowed || ALLOWED_OPTION_WARN

  if (options.output && typeof options.output !== 'function') {
    throw new CUSTOMISE_FAILED('options.output is optionnal and must be a function.')
  }

  const output_function = options.output || global.console.log

  const errors = validator(this._instance, this._schema, options.allowed)

  // Write 'Warning:' in bold and in yellow
  const BOLD_YELLOW_TEXT = '\x1b[33;1m'
  const RESET_TEXT = '\x1b[0m'

  if (errors.invalid_type.length + errors.undeclared.length + errors.missing.length) {
    const sensitive = this._sensitive

    const fillErrorBuffer = function(errors) {
      const messages = []
      errors.forEach(function(err) {
        let err_buf = '  - '

        /* if (err.type) {
          err_buf += '[' + err.type + '] ';
        } */
        if (err.fullName) {
          err_buf += unroot(err.fullName) + ': '
        }
        if (err.message) {
          err_buf += err.message
        }

        const hidden = !!sensitive.has(err.fullName)
        const value = (hidden) ? '[Sensitive]' : JSON.stringify(err.value)
        const getterValue = (hidden) ? '[Sensitive]' : JSON.stringify(err.getter && err.getter.keyname)

        if (err.value) {
          err_buf += ': value was ' + value

          const getter = (err.getter) ? err.getter.name : false

          if (getter) {
            err_buf += ', getter was `' + getter
            err_buf += (getter !== 'value') ? '[' + getterValue + ']`' : '`'
          }
        }

        if (!(err instanceof BLUECONFIG_ERROR)) {
          let warning = '[/!\\ this is probably blueconfig internal error]'
          console.error(err)
          if (process.stdout.isTTY) {
            warning = BOLD_YELLOW_TEXT + warning + RESET_TEXT
          }
          err_buf += ' ' + warning
        }

        messages.push(err_buf)
      })
      return messages
    }

    const types_err_buf = fillErrorBuffer(errors.invalid_type).join('\n')
    const params_err_buf = fillErrorBuffer(errors.undeclared).join('\n')
    const missing_err_buf = fillErrorBuffer(errors.missing).join('\n')

    const output_err_bufs = [types_err_buf, missing_err_buf]

    if (options.allowed === ALLOWED_OPTION_WARN && params_err_buf.length) {
      let warning = 'Warning:'
      if (process.stdout.isTTY) {
        warning = BOLD_YELLOW_TEXT + warning + RESET_TEXT
      }
      output_function(warning + '\n' + params_err_buf)
    } else if (options.allowed === ALLOWED_OPTION_STRICT) {
      output_err_bufs.push(params_err_buf)
    }

    const output = output_err_bufs
      .filter(function(str) { return str.length })
      .join('\n')

    if (output.length) {
      throw new VALIDATE_FAILED(output)
    }
  }
  return this
}

ConfigObjectModel.prototype.applyValues = function(from, to, schema) {
  Apply.values.call(this, from, to, schema)
}
