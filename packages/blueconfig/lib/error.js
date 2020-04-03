/**
 * @namespace ZCUSTOMERROR
 */

/**
 * Custom Blueconfig errors are used to identify: Blueconfig internal error, Schema error or config error.
 *
 * This class is Parent of all other Blueconfig errors, all errors are inherited of this one.
 *
 * @example
 * if (myError instanceof BLUECONFIG_ERROR) {
 *   console.log('is blueconfig error');
 * }
 *
 * @extends Error
 *
 * @Memberof ZCUSTOMERROR
 */
class BLUECONFIG_ERROR extends Error {
  /**
   * @param {String}   message   Error message
   */
  constructor(message) {
    super(message)
    return this
  }
}


/**
 * List of errors (should be loop/parsed on LISTOFERRORS.errors like an array). Can be usefull with custom format.
 *
 * @example
 * blueconfig.addFormat({
 *   name: 'children',
 *   validate: function(children, schema, fullname) {
 *     Object.keys(children).forEach((keyname) => {
 *       try {
 *         const conf = blueconfig(schema.children).merge(children[keyname]).validate();
 *         this.set(keyname, conf.getProperties());
 *       } catch (err) { errors.push(err); }
 *     });
 *
 *     if (errors.length !== 0) { throw new LISTOFERRORS(errors) }
 *   }
 * });
 *
 * @extends BLUECONFIG_ERROR
 *
 *
 * @Memberof ZCUSTOMERROR
 */
class LISTOFERRORS extends BLUECONFIG_ERROR {
  /**
   * @param {BLUECONFIG_ERROR[]}   errors   List of errors
   */
  constructor(errors) {
    super('List of several errors.')

    /**
     * List of errors
     *
     * @var errors
     * @memberof LISTOFERRORS
     */
    this.errors = errors

    return this
  }
}


// =========================================
// ============= BLUECONFIG ERROR =============
// =========================================

// new Error = Probably a blueconfig internal error

// =========================================
// ============= INSIDE ERROR ==============
// ============= SCHEMA ERROR ==============
// =========================================
// This is probably a js/application problem.


/**
 * Fired when schema is not valid.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class SCHEMA_INVALID extends BLUECONFIG_ERROR {
  /**
   * @param {String}   fullName   Return the full selector (e.g.: `base.path.name`)
   * @param {String}   message    Error message
   */
  constructor(fullName, message) {
    super(`${fullName}: ${message}`)

    /**
     * Return the full selector (e.g.: `base.path.name`)
     *
     * @var fullName
     * @memberof SCHEMA_INVALID
     */
    this.fullName = fullName

    this.type = 'SCHEMA_INVALID'
    this.doc = 'You schema is not valid, edit your schema to continue.'

    return this
  }
}

// =========================================
// ============= INSIDE ERROR ==============
// =============== JS ERROR ================ (with custom getter, format or parser)
// ========================================= or wrong path with get/set/default/reset/getOrigin function.
// This is probably a js/application problem.


/**
 * Fired when adding custom getter/format/parser failed.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class CUSTOMISE_FAILED extends BLUECONFIG_ERROR {
  /**
   * @param {String}   message    Error message
   */
  constructor(message) {
    super(message)

    this.type = 'CUSTOMISE_FAILED'
    this.doc = 'You try to add a getter/format/parser but you failed, fix your javascript code to continue.'

    return this
  }
}


/**
 * Fired when the usage of Blueconfig functions are wrong.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class INCORRECT_USAGE extends BLUECONFIG_ERROR {
  /**
   * @param {String}   message    Error message
   */
  constructor(message) {
    super(message)

    this.type = 'INCORRECT_USAGE'
    this.doc = 'Wrong usage of blueconfig function, maybe wrong parameter, fix your javascript code to continue.'

    return this
  }
}


/**
 * Fired when we try to access to missed value (e.g.: `base.path.undefined.undefined.name` where `undefined` doesn't exist)
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class PATH_INVALID extends BLUECONFIG_ERROR {
  /**
   * @param {String}   fullName        Return the full selector of value missed (e.g.: `base.path.name`)
   * @param {String}   lastPosition    Return the nearest full selector before missed key (e.g.: `base.path.name`)
   * @param {Object}   parent          Parent
   * @param {Object}   parent.path     Return the full path of `parent`
   * @param {Object}   parent.value    Return the value of `parent`
   */
  constructor(fullName, lastPosition, parent) {
    let path = parent.path
    const state = (() => {
      const type = typeof parent.value
      if (type !== 'object') {
        return `a ${type}`
      } else if (parent.value === null) {
        return 'null'
      } else {
        path = lastPosition
        return 'not defined'
      }
    })()
    const why = `"${path}" is ${state}`

    super(`${fullName}: cannot find "${lastPosition}" property because ${why}.`)

    /**
     * Return the full selector to the properties missing (e.g.: `base.path.name`)
     *
     * @var fullName
     * @memberof PATH_INVALID
     */
    this.fullName = fullName

    /**
     * Return the nearest full selector before missed properties (e.g.: `base.path.name`)
     *
     * @var lastPosition
     * @memberof PATH_INVALID
     */
    this.lastPosition = lastPosition

    /**
     * Error explanation
     *
     * @var why
     * @memberof PATH_INVALID
     */
    this.why = why

    this.type = 'PATH_INVALID'
    this.doc = 'To fix this error you should try to use an existing property path (take a look on the schema), edit your javascript file to continue.'

    return this
  }
}

// =========================================
// ============== USER ERROR ===============
// === (values don't respect the schema) ===
// =========================================
// This is probably a config problem.


/**
 * Validate failed because wrong value.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class VALUE_INVALID extends BLUECONFIG_ERROR {
  /**
   * @param {String}   message    Error message
   */
  constructor(message) {
    super(message)

    this.type = 'VALUE_INVALID'
    this.doc = 'You should try to change your config to respect the schema to continue.'

    return this
  }
}


/**
 * Validate failed because wrong value.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class VALIDATE_FAILED extends BLUECONFIG_ERROR {
  /**
   * @param {String}    explains    List of explained error why validate failed
   */
  constructor(explains) {
    super('Validate failed because wrong value(s):\n' + explains)

    /**
     * List of explained error why validate failed (defined with the first argument of the constructor)
     * @name why
     * @memberof VALIDATE_FAILED
     */
    this.why = explains

    this.type = 'VALIDATE_FAILED'
    this.doc = 'You should try to change your config to respect the schema to continue.'

    return this
  }
}


/**
 * Value has wrong format.
 *
 * When an Error is caught in format function during the validation, FORMAT_INVALID is fired instead.
 *
 * @extends BLUECONFIG_ERROR
 *
 * @Memberof ZCUSTOMERROR
 */
class FORMAT_INVALID extends BLUECONFIG_ERROR {
  /**
   * @param {String}   fullName        Return the full selector (e.g.: `base.path.name`)
   * @param {String}   message         Error message
   * @param {Object}   getter          Getter
   * @param {String}   getter.name     Getter name
   * @param {String}   getter.value    Getter value (=Getter keyname)
   * @param {String}   getter          Returned value by `Getter(keyname)`
   */
  constructor(fullName, message, getter, value) {
    super(message)

    /**
     * Return the full selector (e.g.: `base.path.name`)
     *
     * @var fullName
     * @memberof FORMAT_INVALID
     */
    this.fullName = fullName

    /**
     * Return the nearest full selector before missed key (e.g.: `base.path.name`)
     *
     * @var getter
     * @typedef {Object}
     * @property {string} name Getter name
     * @property {string} value Getter keyname
     * @memberof FORMAT_INVALID
     */
    this.getter = {
      name: getter.name,
      keyname: getter.keyname
    }

    /**
     * Returned value by `this.getter`
     *
     * @var value
     * @memberof FORMAT_INVALID
     */
    this.value = value

    this.type = 'FORMAT_INVALID'
    this.doc = 'You should try to change the property value to respect the schema to continue.'

    return this
  }
}

module.exports = {
  BLUECONFIG_ERROR,
  LISTOFERRORS,
  // 1
  SCHEMA_INVALID,
  // 2
  CUSTOMISE_FAILED,
  INCORRECT_USAGE,
  PATH_INVALID,
  // 2
  VALUE_INVALID,
  VALIDATE_FAILED,
  FORMAT_INVALID
}
