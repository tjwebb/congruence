var _ = require('lodash');
var assert = require('assert');
var semver = require('semver');
var EventEmitter = require('events').EventEmitter;

describe('congruence', function () {

  before(function () {
    _.mixin(require('./'));
  });

  describe('sanity', function () {
    it('should be require-able', function () {
      assert(require('./'));
    });
    it('should mix into underscore', function () {
      assert(_.isFunction(_.congruent));
      assert(_.isFunction(_.similar));
      assert(_.isFunction(_.isPlainObject));
      assert(_.isFunction(_.not));
    });
  });

  describe('_#essentialize', function () {
    it('should return a hash of an object\'s keys', function () {
      var testObject1 = { a: 1, b: 2 },
        testObject2 = { a: 1, b: 2, c: 3 };

      assert.equal(_.essentialize(testObject1), 'wv457gnfxp');
      assert.equal(_.essentialize(testObject2), 'rjjp0f0dnp');
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
      assert(_.congruent(template, object));
    });
    it('should validate string type predicate', function () {
      var template = { a: _.isString },
        object = { a: 'hello' };
      assert(_.congruent(template, object));
    });
    it('should validate null type predicate', function () {
      var template = { a: _.isNull },
        object = { a: null };
      assert(_.congruent(template, object));
    });
    it('should validate list type predicate', function () {
      var template = { a: _.isArray },
        object1 = {
          a: [ ]
        },
        object2 = {
          a: [ 1, 2, 3 ]
        };
      assert(_.congruent(template, object1));
      assert(_.congruent(template, object2));
    });
    it('should validate list equality', function () {
      var template = {
          a: _.partial(_.isEqual, [1, 2, 3])
        },
        object = {
          a: [ 1, 2, 3 ]
        };
      assert(_.congruent(template, object));
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
      assert(_.congruent(template, object));
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
      assert(_.congruent(template, object));
    });
    it('should invalidate value inequality', function () {
      var template = {
          a: _.isNumber, 
          b: 2.718
        },
        object = {
          a: 1,
          b: 999
        };
      assert(!_.congruent(template, object));
    });
    it('should validate nested value equality', function () {
      var template = {
          level: _.congruent({
            a: _.isNumber, 
            b: 2.718
          })
        },
        object = {
          level: {
            a: 1,
            b: 2.718
          }
        };
      assert(_.congruent(template, object));
    });
    it('should curry arguments', function () {
      var template = _.congruent({
        a: _.isNumber, 
        b: 2.718
      });
      var object = {
        a: 1,
        b: 999
      };
      var congruent = template(object);
      assert(!congruent);
    });
    it('should invalidate nested value inequality', function () {
      var template = {
          level: _.congruent({
            a: _.isNumber, 
            b: 2.718
          })
        },
        object = {
          level: {
            a: 1,
            b: 999
          }
        };
      assert(!_.congruent(template, object));
    });
    it('should validate wildcard predicate for all values except undefined', function () {
      var template = {
        a: _.compose(_.not, _.isUndefined)
      };

      assert(_.congruent(template, { a: 'hello world' }));
      assert(_.congruent(template, { a: { } }));
      assert(_.congruent(template, { a: 123 }));
      assert(_.congruent(template, { a: [1, 2, 3] }));
      assert(_.congruent(template, { a: null }));
      assert(_.congruent(template, { a: 0 }));
      assert(_.congruent(template, { a: false }));

      assert(!_.congruent(template, { a: undefined }));
      assert(!_.congruent(template, { }));
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
          foo: _.congruent({
            bar: _.isObject
          })
        },
        object = {
          a: 1,
          foo: {
            bar: {
              b: 2.718
            }
          }
        };
      assert(_.congruent(template1, object));
      assert(_.congruent(template2, object));
      assert(_.congruent(template3, object));
    });

    it('should validate non-strict object predicate', function () {
      var template = { a: _.isObject };
      assert(_.congruent(template, { a: [ ] }));
      assert(_.congruent(template, { a: function () { } }));
    });
    it('should invalidate false list predicate', function () {
      var template = { a: _.isArray },
        object = { a: { } };
      assert(!_.congruent(template, object));
    });
    it('should invalidate false *strict* object predicate', function () {
      var template = { a: _.isPlainObject };
      assert(!_.congruent(template, { a: [ ] }));
      assert(!_.congruent(template, { a: function () { } }));
    });
    it('should invalidate falsy predicate', function () {
      var template = { a: _.isString },
        object = { a: { } };
      assert(!_.congruent(template, object));
    });
    it('should invalidate value inequality', function () {
      var template = { a: 'hello' },
        object = { a: 'world' };
      assert(!_.congruent(template, object));
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
      assert(!_.congruent(template, object1));
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
      assert(!_.congruent(template, object));
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
      assert(!_.congruent(template, object));
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
      assert(!_.congruent(template, object));
    });
    it('should fire invalid:keys event on keys mismatch', function (done) {
      var template = {
        a: 1,
        foo: 'bar'
      };
      var object = {
        b: 2
      };
      var emitter = new EventEmitter();
      emitter.on('invalid:keys', function (error) {
        assert(_.isObject(error));
        done();
      });
      assert(!_.congruent(template, object, emitter));
    });
    it('should fire invalid:value event on predicate failure', function (done) {
      var template = {
        a: 2
      };
      var object = {
        a: 1
      };
      var emitter = new EventEmitter();
      emitter.on('invalid:value', function (error) {
        assert(error.key === 'a');
        assert(_.isObject(error));
        done();
      });
      assert(!_.congruent(template, object, emitter));
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

      assert(_.similar(template, object));
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

      assert(!_.similar(template, object));
    });
    describe('performance', function () {
      it('should evaluate 100k simple comparisons (n=10e4, levels=1, t < 2s)', function () {
        this.timeout(2000);
        var template = {
          id: _.isNumber,
          firstname: 'Travis',
          lastname: /We/
        };
        for (var i = 0; i < 10e4; i++) {
          var rand = Math.random(),
            object = {
              id: rand,
              firstname: 'Travis',
              lastname: 'Webb'
            };

          assert(_.similar(template, object));
        }
      });
      it('should quickly evaluate 100k nested comparisons (n=10e4, levels=2, t < 5s)', function () {
        this.timeout(5000);
        var template = {
          id: _.isNumber,
          firstname: 'Travis',
          lastname: /We/,
          preferences: _.similar({
            color: _.isString
          })
        };
        for (var i = 0; i < 10e4; i++) {
          var rand = Math.random(),
            object = {
              id: rand,
              firstname: 'Travis',
              lastname: 'Webb',
              preferences: {
                color: 'blue',
                pants: 'none',
                drink: 'water'
              }
            };

          assert(_.similar(template, object));
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
        assert(_.congruent(matchingTemplate1, object));
        assert(_.congruent(matchingTemplate2, object));

        assert(!_.congruent(failedTemplate1, object));
        assert(!_.congruent(failedTemplate2, object));
    });
    it('should pass README headline example', function () {
      var template = { module: _.isString,   version: semver.valid };
      var object =   { module: 'congruence', version: 'v1.6.8'     };
      assert(_.congruent(template, object));
    });
    it('should validate objects with keys a AND/OR b', function () {
      var templates = [
        { a: _.isString },
        { b: _.isString }
      ];
      assert(
        _.any(templates, function (template) {
          return _.similar(template, { a: 'hello' });
        })
      );
      assert(
        _.any(templates, function (template) {
          return _.similar(template, { b: 'world' });
        })
      );
      assert(
        _.any(templates, function (template) {
          return _.similar(template, {
            a: 'hello',
            b: 'world'
          });
        })
      );
      assert(
        !_.any(templates, function (template) {
          return _.similar(template, {
            c: 'lala'
          });
        })
      );
    });
  });
});
