const ConfigObjectModel = require('./model/com.js')

const ParserInterface = require('./performer/parser.js')
const GetterInterface = require('./performer/getter.js')
const RulerInterface = require('./performer/ruler.js')

const cvtError = require('./error.js')
const CUSTOMISE_FAILED = cvtError.CUSTOMISE_FAILED


/**
 *
 * @returns Returns a ConfigObjectModel (= COM, Like DOM but not for Document, for Config)
 *
 * @class
 */
const Blueconfig = function() {
  this.initPerformer()
}

module.exports = Blueconfig


Blueconfig.prototype.initPerformer = function() {
  this.Parser = new ParserInterface()
  this.Getter = new GetterInterface()
  this.Ruler = new RulerInterface()
}


Blueconfig.prototype.init = function(rawSchema, options) {
  return new ConfigObjectModel(rawSchema, options, {
    Parser: this.Parser,
    Getter: this.Getter,
    Ruler: this.Ruler
  })
}


/**
 * Gets array with getter name in the current order of priority
 *
 * @example
 * blueconfig.getGettersOrder(); // ['default', 'value', 'env', 'arg', 'force']
 */
Blueconfig.prototype.getGettersOrder = function() {
  return [...this.Getter.storage.order]
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
Blueconfig.prototype.sortGetters = function(newOrder) {
  const sortFilter = this.Getter.sortGetters(this.Getter.storage.order, newOrder)

  this.Getter.storage.order.sort(sortFilter)
}


/**
 * Adds a new custom getter. Getter function get value depending of the property name. In schema, the property name is a keyname of the schema.
 *
 * @example
 * convict.addGetter('aws', function(aws, schema, stopPropagation) {
 *   return aws.get(aws)
 * }, false, true);
 *
 * @param {String|Object}       name                      String for Getter name, `Object/Object[]` or which contains arguments:
 * @param    {String}           name.name             Getter name
 * @param    {Function}         name.getter               *See below*
 * @param    {Boolean}          [name.usedOnlyOnce=false] *See below*
 * @param    {Boolean}          [name.rewrite=false]      *See below*
 * @param    {ConfigObjectModel.getterCallback}   getter  Getter function get external value depending of the name name.
 * @param    {Boolean}          [usedOnlyOnce=false]      `false` by default. If true, The value can't be reused by another `keyname=value`
 * @param    {Boolean}          [rewrite=false]           Allow rewrite an existant format
 */
Blueconfig.prototype.addGetter = function(name, getter, usedOnlyOnce, rewrite) {
  if (typeof name === 'object') {
    getter = name.getter
    usedOnlyOnce = name.usedOnlyOnce
    rewrite = name.rewrite
    name = name.name || name.property
  }
  this.Getter.add(name, getter, usedOnlyOnce, rewrite)
}


/**
 * Adds several getters
 *
 * @example
 * // Example with the default env & arg getters:
 * Blueconfig.addGetters({
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
 * @param {Object|Object[]}    getters                      Object containing list of Getters/Object
 * @param {Object}    getters.{name}                        {name} in `getters.{name}` is the getter name
 * @param {Function}  getters.{name}.getter                 *See Blueconfig.addGetter*
 * @param {Boolean}   [getters.{name}.usedOnlyOnce=false]   *See Blueconfig.addGetter*
 * @param {Boolean}   [getters.{name}.rewrite=false]        *See Blueconfig.addGetter*
 */
Blueconfig.prototype.addGetters = function(getters) {
  if (Array.isArray(getters)) {
    return getters.forEach((child) => {
      this.addGetter(child)
    })
  }
  Object.keys(getters).forEach((name) => {
    const child = getters[name]
    this.addGetter(name, child.getter, child.usedOnlyOnce, child.rewrite)
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
 * @param {String|Object}                name              String for Format name, `Object/Object[]` or which contains arguments:
 * @param    {String}                    name.name         Format name
 * @param    {Function}                  name.validate     *See below*
 * @param    {Function}                  name.coerce       *See below*
 * @param    {Boolean}               [name.rewrite=false]  *See below*
 * @param {ConfigObjectModel._cvtValidateFormat}  validate Validate function, should throw if the value is wrong `Error` or [`LISTOFERRORS` (see example)](./ZCUSTOMERROR.LISTOFERRORS.html)
 * @param {ConfigObjectModel._cvtCoerce} coerce            Coerce function to convert a value to a specified function (can be omitted)
 * @param    {Boolean}                   [rewrite=false]   Allow rewrite an existant format
 */
Blueconfig.prototype.addFormat = function(name, validate, coerce, rewrite) {
  if (typeof name === 'object') {
    validate = name.validate
    coerce = name.coerce
    rewrite = name.rewrite
    name = name.name
  }
  this.Ruler.add(name, validate, coerce, rewrite)
}


/**
 * Adds several formats
 *
 * @example
 * // Add several formats with: [Object, Object, Object, Object]
 * const vFormat = require('blueconfig-format-with-validator')
 * blueconfig.addFormats({ // add: email, ipaddress, url, token
 *   email: vFormat.email,
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
 * @param {Object|Object[]}    formats               Object containing list of Object
 * @param {Object}    formats.{name}                 {name} in `formats.{name}` is the format name
 * @param {Function}  formats.{name}.validate        *See Blueconfig.addFormat*
 * @param {Function}  formats.{name}.coerce          *See Blueconfig.addFormat*
 * @param {Boolean}   [formats.{name}.rewrite=false] *See Blueconfig.addFormat*
 */
Blueconfig.prototype.addFormats = function(formats) {
  if (Array.isArray(formats)) {
    return formats.forEach((child) => {
      this.addFormat(child)
    })
  }
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
Blueconfig.prototype.addParser = function(parsers) {
  if (!Array.isArray(parsers)) parsers = [parsers]

  parsers.forEach((parser) => {
    if (!parser) throw new CUSTOMISE_FAILED('Invalid parser')
    if (!parser.extension) throw new CUSTOMISE_FAILED('Missing parser.extension')
    if (!parser.parse) throw new CUSTOMISE_FAILED('Missing parser.parse function')

    this.Parser.add(parser.extension, parser.parse)
  })
}
