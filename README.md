congruence
==========

[![Build Status](https://travis-ci.org/tjwebb/congruence.png?branch=master)](https://travis-ci.org/tjwebb/congruence)

Validate the structure of Javascript objects using semantic templates. Written as an underscore mixin.

#### 0. Concept

  Use this module to check the congruence of Javascript structures and validity
  of values using semantic templates. Suppose an object:

    var obj = {
      megahertz: 266,
      message: 'hello world'
    };

  We use the built-in underscore matching functions to build a template that
  we can validate against. Here is a template that matches `obj` above:

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

#### 1. Examples

        // Unmatched template properties are marked with '->'
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
                d: _.not(_.isFunction)
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
      ->    a: _.not(_.isNumber),     // object.a = 3.14... is a number
      ->    bar: {                    // object structure is foo.bar, not bar.foo
      ->      foo: {
                b: _.isString,
                c: _.isArray,
                d: _.isDate
              }
            }
          };

        assert.isTrue(_.test(matchingTemplate1, object));
        assert.isTrue(_.test(matchingTemplate2, object));

        assert.isFalse(_.test(failedTemplate1, object));
        assert.isFalse(_.test(failedTemplate2, object));

#### 4. Full Underscore API

- `_.test(template, object)`
  - Test the object against the given template
  - General Usage:

            var template = {
                <key>: <predicate>
              },
              object = {
                <key>: <value>
              };

            _.test(template, object)

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
            assert.isTrue(_.test(template, object));

- `_.isDefined(value)`
  - return true if value is not `undefined`

- `_.isObjectStrict(value)`
  - strictly check whether `value` is an object. It cannot be an array or function.

