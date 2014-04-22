congruence
==========

[![Build Status](https://travis-ci.org/tjwebb/congruence.png?branch=master)](https://travis-ci.org/tjwebb/congruence)

## 0. Quick four-line code example:

    _.mixin(require('congruence'));
    var template = { module: _.isString,   version: semver.valid };
    var object =   { module: 'congruence', version: 'v1.2.9'     };
    assert.isTrue(_.congruent(template, object));

Above, the object is **congruent** to the template because `object.module` is a
string, and `semver.valid`[[1]](https://www.npmjs.org/package/semver) returns
true for `object.version`[[2]](https://github.com/tjwebb/congruence/blob/master/spec/congruence.js#L578).
    
It's like regular expressions for Javascript objects. Easily test the structure
of Javascript objects using expressive templates. Designed as an underscore mixin.

## 1. Concept

  Use this module to check the congruence of Javascript structures and validity
  of values using semantic templates. Suppose an object:

    var obj = {
      megahertz: 266,
      message: 'hello world'
    };

  We use the built-in underscore matching functions to build a template
  (an isometry) that we can validate against. Here is a template that matches
  `obj` above:

    var matchingTemplate = {
      megahertz: _.isNumber
      message: _.isString
    };

  But this will not match:

    var failedTemplate = {
      megahertz: 500,
      foo: _.isFunction
    };

  Both properties will fail validation. 
  If a non-function is given in the template value, it will be used as a strict
  equality check. `megahertz` is not equal to `500` so that fails. And the
  template requires `foo` to be a function, but `obj.foo` is not even defined.

## 2. Examples
### A. Basic Usage
- Unmatched template properties are marked with `->`

          var object = {
              a: 3.1415926535,
              foo: {
                bar: {
                  b: 'hello world',
                  c: [ 1, 1, 2, 3, 5, 8 ],
                  d: new Date()
                }
              }
            },
            matchingTemplate1 = {       // matches object
              a: _.isNumber, 
              foo: _.isObject           // don't worry about foo's internal structure
            },
            matchingTemplate2 = {       // matches object
              a: 3.1415926535,
              foo: {
                bar: {
                  b: _.isString,
                  c: _.isArray,
                  d: _.compose(_.not, _.isFunction)
                }
              }
            },
            failedTemplate1 = {
        ->                              // this template does not allow the 'a' property
              foo: {
                bar: _.isObject,
        ->      hello: 'world'          // hello is not a supported property of 'foo'
              }
            },
            failedTemplate2 = {
        ->    a: _.compose(_.not, _.isNumber),    // object.a = 3.14... is a number and will fail
        ->    bar: {                    // object structure is foo.bar, not bar.foo
        ->      foo: {
                  b: _.isString,
                  c: _.isArray,
                  d: _.isDate
                }
              }
            };

          assert.isTrue(_.congruent(matchingTemplate1, object));
          assert.isTrue(_.congruent(matchingTemplate2, object));

          assert.isFalse(_.congruent(failedTemplate1, object));
          assert.isFalse(_.congruent(failedTemplate2, object));

### B. Advanced Usage
- `(?)` means "optional"
- `(+)` means "one or more"

          var template = {
              '(?)parameters': {
                '(+)' : _.or(
                  { $lt: _.or(_.isNumber, _.isDate) },
                  { $gt: _.or(_.isNumber, _.isDate) },
                  { $eq: _.isDefined }
                )
              },
              '(?)orderby': {
                '(+)': _.or(_.isNumber, /ASC/i, /DESC/i)
              }
            },
            matchingObject1 = {
              parameters: {
                amount:   { $lt: 500 },
                balance:  { $gt: 100 }
              },
              orderby: {
                balance: 'asc'
              }
            },
            matchingObject2 = {
              parameters: {
                balance:  { $eq: 1000 }
              }
            },
            invalidObject1 = {
              parameters: {
                amount:  { $lt: 'hello' }
              },
        ->    orderby: 'up'
            },
            invalidObject2 = {
              parameters: {
        ->      amount:  { crap: 'nonsense' }
              }
            },
            errors1 = [ ],
            errors2 = [ ],
            shouldFail1,
            shouldFail2; 

          assert.isTrue(_.congruent(template, matchingObject1));
          assert.isTrue(_.congruent(template, matchingObject2));

          shouldFail1 = _.congruent(template, invalidObject1, errors1);
          assert.isFalse(shouldFail1);
          assert.include(errors1, 'isNumber(hello) returned false');
          assert.include(errors1, 'isDate(hello) returned false');
          assert.include(errors1, 'expected (up) to be an object');

          shouldFail2 = _.congruent(template, invalidObject2, errors2);
          assert.isFalse(shouldFail2);
          assert.include(errors2, 'no match for {"crap":"nonsense"}');

## 3. Full Underscore API

- `_.congruent(template, object, [errors])`
  - Test the object against the given template
  - General Usage:

            var template = {
                <key>: <predicate>
              },
              object = {
                <key>: <value>
              },
              errors = [ ]

            _.congruent(template, object, errors);

  - Any underscore `isXYZ` function can be used as a predicate; you can also define
    your own, e.g.
        
            var template = {
                a: function (list) {
                  return _.all(list, function (value) {
                    return (value % 2) > 0;
                  });
                }
              },
              object = {
                a: [ 1, 3, 5 ]
              };
            assert.isTrue(_.congruent(template, object));

- `_.isDefined(value)`
  - return true if value is not `undefined`

- `_.isObjectStrict(value)`
  - strictly check whether `value` is an object. It cannot be an array or function.

# 4. Contribute!
- File a bug or feature request: https://github.com/tjwebb/congruence/issues
- I `<3` pull requests
