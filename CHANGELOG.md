# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [6.2.1] - 2019-05-02
### Fixed
- Fix vulns by upgrading some devDeps and yars-parser (@A-312)

## [6.2.0] - 2019-04-16
### Changed
 - Improve coverage % (@A-312)
 - Code review: Validate is 3 times faster than before (@A-312)
   ```
   convict@5.2.0 x 40,531 ops/sec ±1.59% (86 runs sampled)
   blueconfig@6.2.0 x 134,203 ops/sec ±1.52% (90 runs sampled)
   blueconfig@6.0.2 x 37,208 ops/sec ±1.18% (92 runs sampled)
   Fastest is blueconfig@latest
   ```

## [6.1.0] - 2019-04-09
### Added
 - Accept format in the root of a config tree (@A-312)

### Changed
 - Update package.json description and add tags. (= "Fork of node-convict", "node-convict") (@A-312)
 - Add doc with jsdoc (@A-312)
 - Full code review (+ standard esLint) & rewriting code with class and inheritance (@A-312)
 - Blueconfig can be load without default getters/formats `require('blueconfig/lib/core.js')` (@A-312)


## [6.0.2] - 2019-03-07
### Changed
 - Fix `lerna publish` (@A-312)

## [6.0.1] - 2019-03-07
### Changed
 - Changes URL (@A-312)

## [6.0.0] - 2019-03-07
### Deprecated
 - `load(object)` and `loadFile(filepath)` will become `merge(object || filepath)`.

### Changed

- Update Precendence order documentation according implementation node-convict/#314 (@zaverden) 
- Fire error with 'properties' keyname in schema and 'properties' of blueconfig become '_cvtProperties' (@A-312)
- Add doc about second argument of blueconfig (@A-312)
- Use Chai for test cases instead of Should (@A-312)
- Code review: (@A-312)
  - transform coerce method to be call only once (in normalizeSchema)
  - code review: `let` should only be used when needed
  - Better error handler
  - All test files should be independant

### Breaking Change

- [BREAKING] Coerce from strings to their proper types (NOT MORE) + code review on coercing (@A-312)
- [BREAKING] Multi-packages split / Format with moment and validator become two external packages `blueconfig-format-with-moment` and `blueconfig-format-with-validator` (Multi-packages split with Lerna).(@A-312)
- Error are more human-readable (@A-312)
- [BREAKING] Remove json5 dependency and make it an optional parser node-convict/#326 (@A-312)
- [BREAKING] Improve parsing behavior and default property usage (@A-312):
  - Fix `blueconfig(config.getSchema())`, `.getSchema/getSchemaString()` return a blueconfig schema and `.getSchema(debug = true)` should return blueconfig data schema (for debug usage only).
  - `default` can be used like a property with `$~default` (replaced by `default` during the parsing). Add opt: `blueconfig(schema, { acceptDefaultProperty: '$~default' })`.
  - `format: [ String ]` and `format: [ typeof this !== 'object' ]` is now catch like blueconfig property (format of last property) even if default is not set (new behavior).
  - Add strict parameter for schema parsing: `convict(schema, { strictParsing: true })`.
  - Add `schema.required = true` to allow optional config property or not (don't ignore `default: undefined`)
- [BREAKING] coerce method will be always applied: (@A-312)
  - Before this version: coerce was only applied with: `.set()`, `.env:` and `.arg:`.
  - With this version: coerce is also applied with: `.load()`, `.loadFile()` and `.default:`.
   
  This change mean the value (first argument of coerce method) can be another type of String. **We advice you to add type checking in your coerce function** to avoid an JS error with undefined value. See: array coerce change from: `(v) => v.split(',')` to: `return (v) => (typeof v == 'string') ? v.split(',') : v;`


### Added

- Custom Getter (@A-312)
- Full and stable support of periods in property name and property path (@A-312)



## ---------------- ^^ FORKED ^^ ----------------
My changes start here and my fork become node-blueconfig because I can't contribute on node-convict at the speed I want (merge of the PR is too long !), and I didn't get answer when I ask if I can do a PR about a change (I got only an anwser when I made the PR 2 months after).
## ---------------- ^^ FORKED ^^ ----------------

## [5.2.0] - 2019-10-12
### Added

- Add output preference for validate node-convict/#301 (@A-312)

### Changed

- Bump validator from 10.11.0 to 11.1.0 node-convict/#316 (Tomasz Adamski @tmszdmsk)

### Fixed

- Fix vulns by upgrading some deps (eslint, mocha, coveralls) + npm audit fix
  (Marc-Aurèle Darche @madarche)
- Doc: Fix typo and improve grammar and consistency in double-hyphen warning
  node-convict/#324 (Maya Vera @mayavera)
- Doc: Fix link node-convict/#308 (Brett Neese @brettneese)
- Fix test on Windows node-convict/#304 (@A-312)

## [5.1.0] - 2019-07-26
### Added

- Add context argument to custom format validate node-convict/#296 (@A-312)

## [5.0.2] - 2019-07-26
### Changed

- Include only required validator functions node-convict/#279 (Marcin K @chyzwar)

## [5.0.1] - 2019-07-26
### Fixed

- Fix dev deps vulns by upgrading (nyc, coveralls) node-convict/#295 (Marc-Aurèle Darche @madarche, A-312)

## [5.0.0] - 2019-05-06
### Changed

- Drop long deprecated `strict: true`/`strict: false` option, which has been replaced by the
  `allowed: 'strict`/`allowed: 'warn` option (Marc-Aurèle Darche @madarche)
- Update runtime deps (json5, moment, validator, yargs-parser) (Marc-Aurèle Darche @madarche)
- Update dev deps (coveralls, eslint, js-yaml, mocha, toml) (Marc-Aurèle Darche @madarche)
- Replaced dev deps (istanbul replaced by nyc, obj_diff replaced by
  deep-object-diff) (Marc-Aurèle Darche @madarche)
- Drop Node.js < 6 support due to dep requirements (Marc-Aurèle Darche @madarche)

## [4.4.1] - 2018-12-15
### Fixed

- Fix README for addFormats node-convict/#268, node-convict/#275 (Walter Rumsby @wrumsby, Sebastian Yandun
  @svyandun, Eray Hanoglu @erayhanoglu, Marc-Aurèle Darche @madarche)

### Changed

- Update deps (yargs-parser, validator) (Marc-Aurèle Darche @madarche)

## [4.4.0] - 2018-09-22
### Fixed

- Fixed dot notation parsing by disabling dot-notation option in yarg-parser node-convict/#269 (Patrick Shaw @PatrickShaw)

### Added

- Pass the name of the property being assigned to the custom coerce function node-convict/#262 (Dan Allen @mojavelinux)

## [4.3.2] - 2018-07-19
### Fixed

- Update deps (validator.js@10.4.0, yargs-parser@10.1.0, coveralls@3.0.2) fixes node-convict/#264 (Marc-Aurèle Darche @madarche)

## [4.3.1] - 2018-06-07
### Fixed

- Handle loading empty files node-convict/#257 (Paul Colleoni @polco)

## [4.3.0] - 2018-06-02
### Fixed

- Allow argument value to be falsy node-convict/#246 (Dan Allen @mojavelinux)

### Added

- Accept args and env as parameters to convict function node-convict/#223 (Dan Allen @mojavelinux)
- Allow the default parser to be set node-convict/#248 (Dan Allen @mojavelinux)
- Add package-lock.json file (Marc-Aurèle Darche @madarche)

### Changed

- Update deps (almost all) (Marc-Aurèle Darche @madarche)

### Removed

- Remove browserify package and configuration. This was never needed. (Marc-Aurèle Darche @madarche)

## [4.2.0] - 2018-03-23
### Added

- Enhanced file formats support node-convict/#244 (Tuan Nguyen @rocketspacer)

### Changed

- Fix doc (Marc-Aurèle Darche @madarche)

## [4.1.0] - 2018-03-15
### Changed

- Make warnings more visible by coloring them node-convict/#242 (Nawfel @NawfelBgh)

### Fixed
- Fix custom format object nested properties warning by checking for the item
  type instead of item format node-convict/#234 (Helias Criouet @Helias-Criouet)
- Fix README on how cli args work node-convict/#226 (Ian Chadwick @ianchadwick)

## [4.0.2] - 2017-11-30
### Security

- Update moment to fixed security version node-convict/#231 (Marc-Aurèle Darche @madarche)

## [4.0.1] - 2017-09-17
### Changed

- Update dependencies node-convict/#220 (Marc-Aurèle Darche @madarche)
- Move away from minimist to yargs-parser node-convict/#219 (Marc-Aurèle Darche @madarche)
- Corrected a typo node-convict/#218 (Nikolay Govorov @nikolay-govorov)
- Fix issue with empty string over default not null value node-convict/#217 (Jonathan Petitcolas @jpetitcolas)
- Ensure property defaults are not modified node-convict/#216 (Eli Young @elyscape)
- Nested props in 'object' values are not undeclared node-convict/#215 (Michael McGahan @mmcgahan)

## [4.0.0] - 2017-06-22
### Added

- Handle shorthand for default empty objects node-convict/#194 (Eli Young @elyscape)
- 100% test coverage node-convict/#192 (Eli Young @elyscape)
- Include static tests in code coverage checks node-convict/#191 (Eli Young @elyscape)
- Add support for masking sensitive values node-convict/#190 (Eli Young @elyscape)
- Support mapping env vars to multiple settings node-convict/#189 (Richard Marmorstein @twitchard)

### Changed

- Rework validate() to check for overridden parent node-convict/#206 (Eli Young @elyscape)
- Document that a JSON/JSON5 schema file can be used node-convict/#198 (Marc-Aurèle Darche @madarche)
- Better advertize CLI tests as such node-convict/#197 (Marc-Aurèle Darche @madarche)
- Support arbitrary casing of booleans node-convict/#195 (Eli Young @elyscape)

### Removed

- Remove the npm-shrinkwrap.json file node-convict/#210 (Marc-Aurèle Darche @madarche)

### Fixed

- Fix documentation for config.loadFile() node-convict/#207 (Eli Young @elyscape)
- Tests env/arg type coercion and fix arg number coercion node-convict/#199 (Eli Young @elyscape)
- Make schema objects actually useful node-convict/#196 (Eli Young @elyscape)

## [3.0.0] - 2017-03-16
### Added

- In `validate` function alter option `strict` to `allowed`, with option values `strict` and `warn` node-convict/#182 (@benTrust)

### Changed

- Rename pipe formats to emphasize that they are for windows pipes node-convict/#179
  (Gurpreet Atwal @gurpreetatwal)
- Update dependencies node-convict/#184 (Marc-Aurèle Darche @madarche)

## [2.0.0] - 2016-12-18

- Named Pipe Support node-convict/#175 (Gurpreet Atwal @gurpreetatwal)
- Stop supporting Node.js 0.12 by december 2016 node-convict/#166 (Marc-Aurèle Darche @madarche)
- Stop supporting Node.js 0.10 by october 2016 node-convict/#164 (Marc-Aurèle Darche @madarche)
- Remove deprecated methods `root` and `toSchemaString`
- Deps: validator@6.2.0
- Deps: moment@2.17.1
- Deps: json5@0.5.1
- devDeps: all up-to-date

## [1.5.0] - 2016-09-28

- Add `RegExp` format node-convict/#165 (@philbooth)

## [1.4.0] - 2016-05-29

- Add new reset method node-convict/#148 (Marc-Aurèle Darche @madarche)
- Replace optimist which is deprecated node-convict/#154 (Brian Vanderbusch @LongLiveCHIEF)
- Move varify to optionalDependencies node-convict/#153 (@mlucool)

## [1.3.0] - 2016-04-07

- Replace cjson with json5 (@ratson)
- Fix missing npm-shrinkwrap.json file in published NPM module

## [1.2.0] - 2016-04-01

- Support for built-in formats in schema files node-convict/#138 (Hem Brahmbhatt @damnhipster)
- Improve stability and security: Use shrinkwrap to lock module dependencies node-convict/#139 (Marc-Aurèle Darche @madarche)
- devDeps: coveralls@2.11.9 to stay in sync
- devDeps: eslint@2.5.3 to stay in sync

## [1.1.3] - 2016-03-18

- Fix Null default with custom validator causes json parse error node-convict/#122 (@RoboPhred)
- Documentation improvement (Brian Vanderbusch @LongLiveCHIEF)
- Deps: moment@2.12.0 to stay in sync
- devDeps: coveralls@2.11.8 to stay in sync
- devDeps: eslint@2.4.0 to stay in sync
- devDeps: mocha-lcov-reporter@1.2.0 to stay in sync

## [1.1.2] - 2016-02-12

- Documentation and management script fixes; no code changes.

## [1.1.1] - 2016-02-05

- Deps: moment@2.11.2 to fix
  https://nodesecurity.io/advisories/moment_regular-expression-denial-of-service
- Deps: validator@4.6.1 to stay in sync

## [1.1.0] - 2016-02-02

- Fix loading consecutive files could cause an error to be thrown node-convict/#111
  (Abdullah Ali @voodooattack)
- Coerce values loaded from a file node-convict/#96 (Jens Olsson @jsol)
- Improvement: Pass instance to coerce node-convict/#109 (Abdullah Ali @voodooattack)
- Fix missing return in validate reducer node-convict/#101 (Kris Reeves @myndzi)
- Deps: moment
- Deps: validator
- Switch back from Blanket to Istanbul for test coverage (Marc-Aurèle Darche @madarche)
- Stricter JSLint linting (Marc-Aurèle Darche @madarche)
- Improve documentation (Olivier Lalonde @olalonde, Marc-Aurèle Darche @madarche)

## [1.0.2] - 2015-12-09

- Merge pull request node-convict/#97 from yoz/cjson-0.3.2
  Update cjson dependency to 0.3.2
- Update cjson dependency to 0.3.2
  This removes the transitive dependency on 'jsonlint' (in favor of json-parse-helpfulerror), which avoids its problems with unstated dependencies on 'file' and 'system'.
- Coerce values loaded from a file
  Previously values were coerced if added through
  set(), command line arguments or env arguments.
  Added the schema to the recursive overlay function
  so that values added through load() and loadFile()
  are also coerced.
  Corrected a test to reflect this.
- Deps: update all
- Switch from JSHint to ESLint

## [1.0.1] - 2015-08-11

- Merge pull request node-convict/#87 from mozilla/rfk/duration-integer-string
  Accept integer millisecond durations in string form, e.g. from env vars.
- Accept integer millisecond durations in string form, e.g. from env vars.

## [1.0.0] - 2015-08-01

- Merge pull request node-convict/#85 from madarche/feat-1.0
  v1.0.0 and remove old deprecated formats ipv4 and ipv6
- Better wording for validate options
- Consistency using periods
- Improve feature description again
- Improved features description
- Better config.validate([options]) doc + beautify
- Update dependencies
- Merge branch 'feat-update-dependencies' into feat-1.0
- v1.0.0 Remove old deprecated formats ipv4 and ipv6

## [0.8.2] - 2015-07-20

- Merge pull request node-convict/#84 from madarche/feat-update-deps
  Update dependencies
- Update dependencies

## [0.8.1] - 2015-07-20

- Merge pull request node-convict/#82 from myndzi/fix-license
  Update package.json 'license' key format
- Merge pull request node-convict/#83 from madarche/feat-get-properties
  Document and test properties and schema export
- Document and test properties and schema export
  This modification also renames the previously undocumented and untested
  following methods:
  * root→getProperties and
  * toSchemaString→getSchemaString
  The renaming was done for clearer intent and consistency in naming. The
  previous method names are still supported but deprecated.
- Update package.json 'license' key format
- Merge pull request node-convict/#80 from madarche/fix-nested-schema-doc
  Document nested settings in schema
- Merge pull request node-convict/#79 from madarche/fix-doc
  Document new strict validation mode
- Document nested settings in schema
  Fixes node-convict/#78
- Document new strict validation mode
  Fixes node-convict/#75
- Merge pull request node-convict/#77 from madarche/fix-test_coverage
  Fix test coverage
- Fix test coverage
  The rationale in this change is to put logic as less as possible in
  .travis.yml since it's not testable on developers' system.
- Merge pull request node-convict/#76 from madarche/feat-update_dependencies
  Update dependencies
- Merge pull request node-convict/#74 from mmerkes/master
  Fixes node-convict/#73, removes validator.check from README.md and adds valid form…
- Update dependencies
- Adds convict.addFormat() to validation section of README and tidies up section
- Fixes node-convict/#73, removes validator.check from README.md and adds valid format checker

## [0.8.0] - 2015-05-31

- Merge pull request node-convict/#64 from umar-muneer/master
  Strict Validation Mode Added
- Merge pull request node-convict/#72 from pdehaan/patch-2
  Fix typos in README
- Fix typos in README

## [0.7.0] - 2015-04-29

- Merge pull request node-convict/#66 from collinwat/add-format-overload
  addFormat supports object arguments as well as function arguments
- Merge pull request node-convict/#70 from madarche/fix-update-deps
  Update dependencies and removed `should` replaced
- Merge pull request node-convict/#69 from madarche/feat-new-nodejs-0.12
  Make CI test Node.js 0.12, the new stable
- Update dependencies and removed `should` replaced
  `should` has been replaced by `js-must`.
- Make CI test Node.js 0.12, the new stable
- Merge pull request node-convict/#61 from ronjouch/browserifyTransformVarify
  Add 'varify' browserify transform to support IE9,10
- Add format supports object arguments as well as function arguments
- Merge pull request node-convict/#62 from madjid04/master
  Add code coverage with blanket
- Strict Validation Mode
  1. Added a fix for nested validation checks.
  2. Modified test case schema and config files.
- Strict Validation Mode Added
  1. Added a Strict Validation mode. If set to true, any properties
  specified in config files that are not declared in the schema will
  result in errors. This is to ensure that the schema and the config
  files are in sync. This brings convict further in line with the concept
  of a “Schema”. By default the strict mode is set to false.
  2. Added test cases for strict mode
- modification of the indentation

## [0.6.1] - 2015-01-12

- Fix duration check node-convict/#54
- Update dependencies node-convict/#48
- Use js-must a safer test assertion library node-convict/#49

## [0.6.0] - 2014-11-14

- Update dependencies (including latest validator) node-convict/#46
- Deprecate "ipv4" and "ipv6" formats

## [0.5.1] - 2014-10-29

- Update dependencies
- Use fix versions everywhere for safe validation
- More readable date for test node-convict/#43

## [0.5.0] - 2014-10-15

- Fix npmignore anything that's not needed for production node-convict/#38
- Fix The schema get modified by convict node-convict/#37
- npm ignore things
- JSHint lint + 80 cols formatting node-convict/#39

## [0.4.3] - 2014-10-13

- Test the correct convict object for the undefined attribute node-convict/#31
- Update moment.js to 2.6.0 node-convict/#36

## [0.4.2] - 2014-01-12

- Update cjson 0.2.1 —> 0.3.0
- Coerce 'nat' formatted values node-convict/#26
- Update canonical package.json URLs node-convict/#24
- Fix 'should handle timestamp' failing test node-convict/#21
- Update package.json node-convict/#43
- Add license info
  * Update Dependency node-convict/#18

## [0.4.1] - 2013-10-14

- Support JSON formatted objects in env

## [0.4.0] - 2013-07-31

## [0.3.3] - 2013-06-18

## [0.3.1] - 2013-06-04

## [0.3.0] - 2013-06-03

## [0.2.3] - 2013-05-27

## [0.2.2] - 2013-05-25

## [0.2.1] - 2013-05-25

## [0.2.0] - 2013-05-23

## [0.1.1] - 2013-05-19

## [0.1.0] - 2013-03-05

Initial release
