/**
 * Blueconfig
 *
 * forked-from: node-config
 * forked-from: Configuration management with support for environmental variables, files, and validation.
 */

const parseArgs = require('yargs-parser')
const cloneDeep = require('lodash.clonedeep')
const parsePath = require('objectpath').parse
const stringifyPath = require('objectpath').stringify
const cvtError = require('./error.js')

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

const utils = require('./model/utils.js')
const walk = utils.walk
const isObjNotNull = utils.isObjNotNull
const unroot = utils.unroot

const ConfigObjectModel = require('./model/com.js')

const ParserInterface = require('./performer/parser.js')
const Parser = new ParserInterface()
const GetterInterface = require('./performer/getter.js')
const Getter = new GetterInterface()
const RulerInterface = require('./performer/ruler.js')
const Ruler = new RulerInterface()

const converters = new Map()

const BUILT_INS_BY_NAME = {
  Object: Object,
  Array: Array,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp
}
const BUILT_IN_NAMES = Object.keys(BUILT_INS_BY_NAME)
const BUILT_INS = BUILT_IN_NAMES.map(function(name) {
  return BUILT_INS_BY_NAME[name]
})

function parsingSchema(name, rawSchema, props, fullName) {
  if (name === '_cvtProperties') {
    throw new SCHEMA_INVALID(unroot(fullName), "'_cvtProperties' is reserved word of blueconfig, it can be used like property name.")
  }

  const countChildren = (rawSchema) ? Object.keys(rawSchema).length : 0
  const isArray = (rawSchema) ? Array.isArray(rawSchema) : false
  const hasFormat = (rawSchema) ? rawSchema.format : false

  const isConfigPropFormat = (hasFormat && isObjNotNull(hasFormat) && !Array.isArray(hasFormat))

  const filterName = (name) => {
    return (name === this._defaultSubstitute) ? 'default' : name
  } //                    ^^^^^^^^^^^^^^^^^^ = '$~default'

  name = filterName(name)

  // If the current schema (= rawSchema) :
  //   - is an object not null and not an array ;
  //   - is not a config property :
  //         - has no `.default` ;
  //         - has no `.format` or has `.format: [ isObject && notNull && notArray ]`
  //   - has children.
  // Then: recursively parsing like schema property.
  if (isObjNotNull(rawSchema) && !isArray && countChildren > 0 &&
    !('default' in rawSchema) &&
    (!hasFormat || isConfigPropFormat)
  ) {
    props[name] = {
      _cvtProperties: {}
    }
    Object.keys(rawSchema).forEach((key) => {
      const path = fullName + '.' + key
      parsingSchema.call(this, key, rawSchema[key], props[name]._cvtProperties, path)
    })
    return
  } else if (this._strictParsing && isObjNotNull(rawSchema) && !('default' in rawSchema)) {
    // throw an error instead use magic parsing
    throw new SCHEMA_INVALID(unroot(fullName), 'default property is missing')
  // Magic parsing
  } else if (typeof rawSchema !== 'object' || rawSchema === null || isArray || countChildren === 0) {
    // Parses a shorthand value to a config property
    rawSchema = { default: rawSchema }
  } else if (!('default' in rawSchema) && !isConfigPropFormat) {
    // Set `.default` to undefined when it doesn't exist
    rawSchema.default = (function() {})() // === undefined
  }

  const schema = cloneDeep(rawSchema)
  props[name] = schema

  Object.keys(schema).forEach((keyname) => {
    if (this._getters.list[keyname]) {
      const usedOnlyOnce = this._getters.list[keyname].usedOnlyOnce
      if (usedOnlyOnce) {
        if (!this._getterAlreadyUsed[keyname]) {
          this._getterAlreadyUsed[keyname] = new Set()
        }

        const value = schema[keyname]
        if (this._getterAlreadyUsed[keyname].has(value)) {
          if (typeof usedOnlyOnce === 'function') {
            return usedOnlyOnce(value, schema, fullName, keyname)
          } else {
            const errorMessage = `uses a already used getter keyname for "${keyname}", actual: \`${keyname}[${JSON.stringify(value)}]\``
            throw new SCHEMA_INVALID(unroot(fullName), errorMessage)
          }
        }

        this._getterAlreadyUsed[keyname].add(schema[keyname])
      }
    }
  })

  // mark this property as sensitive
  if (schema.sensitive === true) {
    this._sensitive.add(fullName)
  }

  // store original format function
  let format = schema.format
  const newFormat = (() => {
    if (BUILT_INS.indexOf(format) >= 0 || BUILT_IN_NAMES.indexOf(format) >= 0) {
      // if the format property is a built-in JavaScript constructor,
      // assert that the value is of that type
      const Format = typeof format === 'string' ? BUILT_INS_BY_NAME[format] : format
      const formatFormat = Object.prototype.toString.call(new Format())
      const myFormat = Format.name
      schema.format = format = myFormat
      return (value) => {
        if (formatFormat !== Object.prototype.toString.call(value)) {
          throw new Error('must be of type ' + myFormat)
          //        ^^^^^-- will be catch in _cvtValidateFormat and convert to FORMAT_INVALID Error.
        }
      }
    } else if (typeof format === 'string') {
      // store declared type
      if (!Ruler.types.has(format)) {
        throw new SCHEMA_INVALID(unroot(fullName), `uses an unknown format type (actual: ${JSON.stringify(format)})`)
      }
      // use a predefined type
      return Ruler.types.get(format)
    } else if (Array.isArray(format)) {
      // assert that the value is in the whitelist, example: ['a', 'b', 'c'].include(value)
      const contains = (whitelist, value) => {
        if (!whitelist.includes(value)) {
          throw new Error('must be one of the possible values: ' + JSON.stringify(whitelist))
          //        ^^^^^-- will be catch in _cvtValidateFormat and convert to FORMAT_INVALID Error.
        }
      }
      return contains.bind(null, format)
    } else if (typeof format === 'function') {
      return format
    } else if (format) {
      // Wrong type for format
      const errorMessage = 'uses an invalid format, it must be a format name, a function, an array or a known format type'
      const value = (format || '').toString() || 'is a ' + typeof format
      throw new SCHEMA_INVALID(unroot(fullName), `${errorMessage} (actual: ${JSON.stringify(value)})`)
    } else if (!this._strictParsing && typeof schema.default !== 'undefined') {
      // Magic format: default format is the type of the default value (if strictParsing is not enabled)
      const defaultFormat = Object.prototype.toString.call(schema.default)
      const myFormat = defaultFormat.replace(/\[.* |]/g, '')
      // Magic coerceing
      schema.format = format = myFormat
      return (value) => {
        if (defaultFormat !== Object.prototype.toString.call(value)) {
          throw new Error('must be of type ' + myFormat)
          //        ^^^^^-- will be catch in _cvtValidateFormat and convert to FORMAT_INVALID Error.
        }
      }
    } else { // .format are missing
      const errorMessage = 'format property is missing'
      throw new SCHEMA_INVALID(unroot(fullName), errorMessage)
    }
  })()

  schema._cvtCoerce = (() => {
    if (typeof format === 'string') {
      return Ruler.getCoerceMethod(format)
    } else {
      return (v) => v
    }
  })()

  /**
   * Validate function, if the value is wrong throw: Error or [LISTOFERRORS](./ZCUSTOMERROR.LISTOFERRORS.html) if you have several error (see [LISTOFERRORS](./ZCUSTOMERROR.LISTOFERRORS.html) example)
   *
   * @callback ConfigObjectModel._cvtValidateFormat
   *
   * @example
   * const int = {
   *   name: 'int',
   *   coerce: (value) => (typeof value !== 'undefined') ? parseInt(value, 10) : value,
   *   validate: function(value) {
   *     if (Number.isInteger(value)) {
   *       throw new Error('must be an integer')
   *     }
   *   }
   * }
   *
   *
   * @param    {*}             value       Value of the property to validate
   * @param    {schemaNode}    schema      schemaNode (= rules) of the property
   * @param    {string}        fullName    Full property path
   *
   * @throws {Error}                      Throw Error will output a `FORMAT_INVALID` in your code
   * @throws {ZCUSTOMERROR.LISTOFERRORS}  Throw [LISTOFERRORS](./ZCUSTOMERROR.LISTOFERRORS.html) usefull if you validate a children key.
   *
   * @this {ConfigObjectModel}
   *
   * @see ZCUSTOMERROR.LISTOFERRORS
   */
  schema._cvtValidateFormat = (value) => {
    try {
      newFormat.call(this, value, schema, fullName)
    } catch (err) {
      if (err instanceof LISTOFERRORS) {
        err.message = `${fullName}: Custom format "${schema.format}" tried to validate something and failed:`

        err.errors.forEach((error, i) => {
          err.message += `\n    ${i + 1}) ${unroot(error.parent)}:` + ('\n' + error.why).replace(/(\n)/g, '$1    ')
        })

        throw err
      } else {
        const hasOrigin = !!schema._cvtGetOrigin
        const name = (hasOrigin) ? schema._cvtGetOrigin() : false
        const keyname = (hasOrigin && schema[name]) ? schema[name] : ''
        const getter = { name, keyname }

        throw new FORMAT_INVALID(fullName, err.message, getter, value)
      }
    }
  }
}

/**
 * 
 * @returns Returns a ConfigObjectModel (= COM, Like DOM but not for Document, for Config)
 *
 * @class
 */
const Blueconfig = function (def, opts) {
  return new ConfigObjectModel(def, opts, {
    Getter,
    parsingSchema,
    Parser
  })
}


/**
 * Gets array with getter name in the current order of priority
 *
 * @example
 * blueconfig.getGettersOrder(); // ['default', 'value', 'env', 'arg', 'force']
 */
Blueconfig.getGettersOrder = function() {
  return cloneDeep(Getter.storage.order)
}


/**
 * Sorts getter priority, this function uses ascending order. It is recommanded to uses this function before init COM (with `blueconfig()`)
 * or you should call `<COM>.refreshGetters()`.
 *
 * @see ConfigObjectModel.refreshGetters
 *
 * @example
 * blueconfig.getGettersOrder();
 * // ['default', 'value', 'env', 'arg', 'force']
 * 
 * // two ways to do:
 * blueconfig.setGettersOrder(['default', 'value', 'arg', 'env', 'force']);
 * blueconfig.setGettersOrder(['default', 'value', 'arg', 'env']); // force is optional and must be the last one
 * 
 * blueconfig.getGettersOrder();
 * // ['default', 'value', 'arg', 'env', 'force']
 *
 * @param    {string[]}    newOrder       Value of the property to validate
 */
Blueconfig.sortGetters = function(newOrder) {
  const sortFilter = Getter.sortGetters(Getter.storage.order, newOrder)

  Getter.storage.order.sort(sortFilter)
}


/**
 * Adds a new custom getter. Getter function get value depending of the property name. In schema, the property name is a keyname of the schema.
 *
 * @example 
 * convict.addGetter('aws', function(aws, schema, stopPropagation) { 
 *   return aws.get(aws)
 * }, false, true);
 *
 * @param {String|Object|Object[]}    name                String for Getter name, `Object/Object[]` or which contains arguments:
 * @param    {String}           name.property             Getter name
 * @param    {Function}         name.getter               *See below*
 * @param    {Boolean}          [name.usedOnlyOnce=false] *See below*
 * @param    {Boolean}          [name.rewrite=false]      *See below*
 * @param    {ConfigObjectModel.getterCallback}   getter  Getter function get external value depending of the property name.
 * @param    {Boolean}          [usedOnlyOnce=false]      `false` by default. If true, The value can't be reused by another `keyname=value`
 * @param    {Boolean}          [rewrite=false]           Allow rewrite an existant format
 */
Blueconfig.addGetter = function(property, getter, usedOnlyOnce, rewrite) {
  if (typeof property === 'object') {
    getter = property.getter
    usedOnlyOnce = property.usedOnlyOnce
    rewrite = property.rewrite
    property = property.property
  }
  Getter.add(property, getter, usedOnlyOnce, rewrite)
}


/**
 * Adds several getters
 *
 * @example
 * // Example with the default env & arg getters:
 * Blueconfig.addGetter({
 *   env: {
 *     getter: (value, schema) => schema._cvtCoerce(this.getEnv()[value])
 *   },
 *   arg: {
 *     getter: function(value, schema, stopPropagation) {
 *       const argv = parseArgs(this.getArgs(), { configuration: { 'dot-notation': false } })
 *       return schema._cvtCoerce(argv[value])
 *     },
 *     usedOnlyOnce: true
 *   }
 * });
 *
 * @param {Object}    getters                               Array containing list of Getters/Object
 * @param {Object}    getters.{name}                        {name} in `getters.{name}` is the getter name
 * @param {Function}  getters.{name}.getter                 *See Blueconfig.addGetter*
 * @param {Boolean}   [getters.{name}.usedOnlyOnce=false]   *See Blueconfig.addGetter*
 * @param {Boolean}   [getters.{name}.rewrite=false]        *See Blueconfig.addGetter*
 */
Blueconfig.addGetters = function(getters) {
  Object.keys(getters).forEach((property) => {
    const child = getters[property]
    this.addGetter(property, child.getter, child.usedOnlyOnce, child.rewrite)
  })
}


/**
 * Adds a new custom format. Validate function and coerce function will be used to validate COM property with `format` type.
 *
 * @example
 * BluePrint.addFormat({
 *   name: 'int',
 *   coerce: (value) => (typeof value !== 'undefined') ? parseInt(value, 10) : value,
 *   validate: function(value) {
 *     if (Number.isInteger(value)) {
 *       throw new Error('must be an integer')
 *     }
 *   }
 * })
 *
 *
 * @param {String|Object|Object[]}       name              String for Format name, `Object/Object[]` or which contains arguments:
 * @param    {String}                    name.name         Format name
 * @param    {Function}                  name.validate     *See below*
 * @param    {Function}                  name.coerce       *See below*
 * @param    {Boolean}               [name.rewrite=false]  *See below*
 * @param {ConfigObjectModel._cvtValidateFormat}  validate Validate function, should throw if the value is wrong `Error` or [`LISTOFERRORS` (see example)](./ZCUSTOMERROR.LISTOFERRORS.html)
 * @param {ConfigObjectModel._cvtCoerce} coerce            Coerce function to convert a value to a specified function (can be omitted)
 * @param    {Boolean}                   [rewrite=false]   Allow rewrite an existant format
 */
Blueconfig.addFormat = function(name, validate, coerce, rewrite) {
  if (typeof name === 'object') {
    validate = name.validate
    coerce = name.coerce
    rewrite = name.rewrite
    name = name.name
  }
  Ruler.add(name, validate, coerce, rewrite)
}


/**
 * Adds several formats
 *
 * @example
 * // Add several formats with: [Object, Object, Object, Object]
 * const vFormat = require('blueconfig-format-with-validator')
 * blueconfig.addFormat({
 *   email: vFormatemail,
 *   ipaddress: vFormat.ipaddress,
 *   url: vFormat.url,
 *   token: {
 *     validate: function(value) {
 *       if (!isToken(value)) {
 *         throw new Error(':(')
 *       }
 *     }
 *   }
 * })
 *
 * @see Blueconfig.addFormat
 *
 * @param {Object}    formats                        Array containing list of Formats/Object
 * @param {Object}    formats.{name}                 {name} in `formats.{name}` is the format name
 * @param {Function}  formats.{name}.validate        *See Blueconfig.addFormat*
 * @param {Function}  formats.{name}.coerce          *See Blueconfig.addFormat*
 * @param {Boolean}   [formats.{name}.rewrite=false] *See Blueconfig.addFormat*
 */
Blueconfig.addFormats = function(formats) {
  Object.keys(formats).forEach((name) => {
    this.addFormat(name, formats[name].validate, formats[name].coerce, formats[name].rewrite)
  })
}


/**
 * Adds new custom file parsers. JSON.parse will be used by default for unknown extension (default extension -> `*` => JSON). 
 *
 * @example
 * blueconfig.addParser([
 *  { extension: ['yaml', 'yml'], parse: require('yaml').safeLoad },
 *  // will allow comment in json file
 *  { extension: 'json5', parse: require('json5').parse }
 * ]);
 * 
 * @param    {Object[]}    parsers              Parser
 * @param    {string}      parsers.extension    Parser extension
 * @param    {function}    parsers.parse        Parser function
 */
Blueconfig.addParser = function(parsers) {
  if (!Array.isArray(parsers)) parsers = [parsers]

  parsers.forEach((parser) => {
    if (!parser) throw new CUSTOMISE_FAILED('Invalid parser')
    if (!parser.extension) throw new CUSTOMISE_FAILED('Missing parser.extension')
    if (!parser.parse) throw new CUSTOMISE_FAILED('Missing parser.parse function')

    Parser.add(parser.extension, parser.parse)
  })
}

////////////////////////////////////////////


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