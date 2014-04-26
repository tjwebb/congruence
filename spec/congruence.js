var _ = require('lodash'),
  assert = require('chai').assert,
  semver = require('semver');

describe('congruence', function () {

  before(function () {
    _.mixin(require('..'));
  });

  describe('sanity', function () {
    it('should be require-able', function () {
      assert.ok(require('..'));
    });
    it('should mix into underscore', function () {
      assert.isFunction(_.congruent);
      assert.isFunction(_.similar);
      assert.isFunction(_.isPlainObject);
      assert.isFunction(_.not);
    });
  });

  describe('#essentialize', function () {
    it('should return a hash of an object\'s keys', function () {
      var testObject1 = { a: 1, b: 2 },
        testObject2 = { a: 1, b: 2, c: 3 };

      assert.equal(_.essentialize(testObject1), 'kg4bd6i0y3');
      assert.equal(_.essentialize(testObject2), 'f4jv0po6d7');
    });
    it('should return the indentity if given a string', function () {
      assert.equal(_.essentialize('hello'), 'hello');
    });
  });
  describe('_#congruent', function () {
    it('should validate number type predicate', function () {
      var template = {
          a: _.isNumber, 
          b: _.isNumber
        },
        object = {
          a: 1,
          b: 2.718
        };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate string type predicate', function () {
      var template = { a: _.isString },
        object = { a: 'hello' };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate null type predicate', function () {
      var template = { a: _.isNull },
        object = { a: null };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate list type predicate', function () {
      var template = { a: _.isArray },
        object1 = {
          a: [ ]
        },
        object2 = {
          a: [ 1, 2, 3 ]
        };
      assert.isTrue(_.congruent(template, object1));
      assert.isTrue(_.congruent(template, object2));
    });
    it('should validate list equality', function () {
      var template = {
          a: _.partial(_.isEqual, [1, 2, 3])
        },
        object = {
          a: [ 1, 2, 3 ]
        };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate custom list predicate', function () {
      var template = {
          a: function (a) {
            return _.all(a, function (value) {
              return (value % 2) > 0;
            });
          }
        },
        object = {
          a: [ 1, 3, 5 ]
        };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate value equality', function () {
      var template = {
          a: _.isNumber, 
          b: 2.718
        },
        object = {
          a: 1,
          b: 2.718
        };
      assert.isTrue(_.congruent(template, object));
    });
    it('should validate wildcard predicate for all values except undefined', function () {
      var template = {
        a: _.compose(_.not, _.isUndefined)
      };

      assert.isTrue(_.congruent(template, { a: 'hello world' }));
      assert.isTrue(_.congruent(template, { a: { } }));
      assert.isTrue(_.congruent(template, { a: 123 }));
      assert.isTrue(_.congruent(template, { a: [1, 2, 3] }));
      assert.isTrue(_.congruent(template, { a: null }));
      assert.isTrue(_.congruent(template, { a: 0 }));
      assert.isTrue(_.congruent(template, { a: false }));

      assert.isFalse(_.congruent(template, { a: undefined }));
      assert.isFalse(_.congruent(template, { }));
    });
    it('should validate structure congruence', function () {
      var template1 = {
          a: _.isNumber, 
          foo: _.congruent({
            bar: _.congruent({
              b: _.isNumber
            })
          })
        },
        template2 = {
          a: 1,
          foo: _.isObject
        },
        template3 = {
          a: 1,
          foo: {
            bar: _.isObject
          }
        },
        object = {
          a: 1,
          foo: {
            bar: {
              b: 2.718
            }
          }
        };
      assert.isTrue(_.congruent(template1, object));
      //assert.isTrue(_.congruent(template2, object));
      //assert.isTrue(_.congruent(template3, object));
    });

    it('should validate non-strict object predicate', function () {
      var template = { a: _.isObject };
      assert.isTrue(_.congruent(template, { a: [ ] }));
      assert.isTrue(_.congruent(template, { a: function () { } }));
    });
    it('should invalidate false list predicate', function () {
      var template = { a: _.isArray },
        object = { a: { } };
      assert.isFalse(_.congruent(template, object));
    });
    it('should invalidate false *strict* object predicate', function () {
      var template = { a: _.isPlainObject };
      assert.isFalse(_.congruent(template, { a: [ ] }));
      assert.isFalse(_.congruent(template, { a: function () { } }));
    });
    it('should invalidate falsy predicate', function () {
      var template = { a: _.isString },
        object = { a: { } };
      assert.isFalse(_.congruent(template, object));
    });
    it('should invalidate value inequality', function () {
      var template = { a: 'hello' },
        object = { a: 'world' };
      assert.isFalse(_.congruent(template, object));
    });
    it('should invalidate structure incongruence', function () {
      var template = {
          a: _.isNumber, 
          bar: {
            foo: {
              b: _.isNumber
            }
          }
        },
        object1 = {
          a: 1,
          foo: {
            bar: {
              b: 2.718
            }
          }
        };
      assert.isFalse(_.congruent(template, object1));
    });
    it('should invalidate missing object properties', function () {
      var template = {
          a: 1,
          b: _.isObject
        },
        object = {
          b: {
            foo: 'bar'
          }
        };
      assert.isFalse(_.congruent(template, object));
    });
    it('should invalidate superfluous object properties', function () {
      var template = {
          a: 1,
          b: _.isObject
        },
        object = {
          a: 1,
          b: { },
          c: 'extra'
        };
      assert.isFalse(_.congruent(template, object));
    });
    it('should invalidate nested falsy predicate', function () {
      var template = {
          a: _.isNumber, 
          bar: {
            foo: {
              b: _.isArray
            }
          }
        },
        object = {
          a: 1,
          bar: {
            foo: {
              b: 2.718
            }
          }
        };
      assert.isFalse(_.congruent(template, object));
    });
  });
  describe('_#similar', function () {
    it('should validate basic similar template', function () {
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

      assert.isTrue(_.similar(template, object));
    });
    it('should invalidate basic dissimilar template', function () {
      var template = {
          id: 1,
          name: 'Travis'
        },
        object = {
          name: 'Travis',
          color: 'blue'
        };

      assert.isFalse(_.similar(template, object));
    });
    describe('performance', function () {
      it('should quickly evaluate n=10000', function () {
        for (var i = 0; i < 10000; i++) {
          var rand = Math.random(),
            template = {
              id: rand,
              firstname: 'Travis',
              lastname: 'Webb',
            },
            object = {
              id: rand,
              firstname: 'Travis',
              lastname: 'Webb',
              color: 'blue',
              pants: 'none',
              drink: 'water'
            };

          assert.isTrue(_.similar(template, object));
        }
      });
    });
  });
  describe('@example', function () {
    it('should pass README example 1', function () {
        // Unmatched template properties are marked with '  '
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
            foo: _.congruent({
              bar: _.congruent({
                b: _.isString,
                c: _.isArray,
                d: _.compose(_.not, _.isFunction)
              })
            })
          },
          failedTemplate1 = {
            foo: _.congruent({
              bar: _.isObject,
              hello: 'world'          // hello is not a supported property of 'foo'
            })
          },
          failedTemplate2 = {
            a: _.compose(_.not, _.isNumber),    // object.a = 3.14... is a number
            bar: _.congruent({                              // object structure is foo.bar, not bar.foo
              foo: _.congruent({
                b: _.isString,
                c: _.isArray,
                d: _.isDate
              })
            })
          };
        assert.isTrue(_.congruent(matchingTemplate1, object));
        assert.isTrue(_.congruent(matchingTemplate2, object));

        assert.isFalse(_.congruent(failedTemplate1, object));
        assert.isFalse(_.congruent(failedTemplate2, object));
    });
    it('should pass README headline example', function () {
      var template = { module: _.isString,   version: semver.valid };
      var object =   { module: 'congruence', version: 'v1.2.9'     };
      assert.isTrue(_.congruent(template, object));
    });
  });
});
