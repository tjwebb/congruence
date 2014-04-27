congruence
==========

[![Build Status](https://travis-ci.org/tjwebb/congruence.png?branch=master)](https://travis-ci.org/tjwebb/congruence)

## 0. Quick four-line code example:

    ```javascript
    _.mixin(require('congruence'));
    var template = { module: _.isString,   version: semver.valid };
    var object =   { module: 'congruence', version: 'v1.5.2'     };
    assert.isTrue(_.congruent(template, object));
    ```

Above, the object is **congruent** to the template because `object.module` is a
string, and `semver.valid`[[1]](https://www.npmjs.org/package/semver) returns
true for `object.version`.
    
It's like regular expressions for Javascript objects. Easily test the structure
of Javascript objects using expressive templates. Designed as an lodash mixin.

## 1. Concept

  Use this module to check the congruence of Javascript structures and validity
  of values using semantic templates. Suppose an object:

    ```javascript
    var obj = {
      megahertz: 266,
      message: 'hello world'
    };
    ```

  We use the built-in lodash matching functions to build a template
  (an isometry) that we can validate against. Here is a template that matches
  `obj` above:

    ```javascript
    var matchingTemplate = {
      megahertz: _.isNumber
      message: _.isString
    };
    ```

  But this will not match:

    ```javascript
    var failedTemplate = {
      megahertz: 500,
      foo: _.isFunction
    };
    ```

  Both properties will fail validation. 
  If a non-function is given in the template value, it will be used as a strict
  equality check. `megahertz` is not equal to `500` so that fails. And the
  template requires `foo` to be a function, but `obj.foo` is not even defined.

## 2. Examples

### A. Simple Template Congruence

    ```javascript
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
        matchingTemplate = {
          a: 3.1415926535,
          foo: _.congruent({
            bar: _.congruent({
              b: _.isString,
              c: _.isArray,
              d: _.compose(_.not, _.isFunction)
            })
          })
        };

      assert.isTrue(_.congruent(matchingTemplate, object));
    ```

### B. Simple Template Similarity

    ```javascript
      var template = {
          id: 57,
          name: 'Travis'
        },
        object = {
          id: 57,
          name: 'Travis',
          color: 'blue',
          foo: 1
        };

      // the extra object properties are ignored
      assert.isTrue(_.similar(template, object));
    ```

## 3. Full Lodash API

- `_.congruent(template, object, [errors])`
  - Test the object against the given template
  - General Usage:

          ```javascript
            var template = {
                <key>: <predicate>
              },
              object = {
                <key>: <value>
              },
              errors = [ ]

            _.congruent(template, object, errors);
          ```

  - Any lodash `isXYZ` function can be used as a predicate; you can also define
    your own, e.g.
        
          ```javascript
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
          ```

## 4. Contribute!
- File a bug or feature request: https://github.com/tjwebb/congruence/issues
- I `<3` pull requests
