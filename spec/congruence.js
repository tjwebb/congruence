var _ = require('underscore'),
    assert = require('chai').assert;

describe('congruence', function () {

  before(function () {
    _.mixin(require('../congruence'));
  });

  describe('sanity', function () {
    it('should be require-able', function () {
      assert.ok(require('../congruence'));
    });
    it('should mix into underscore', function () {
      assert.isFunction(_.test);
      assert.isFunction(_.isDefined);
      assert.isFunction(_.isObjectStrict);
    });
  });
});

describe('underscore', function () {
  describe('#not', function () {
    it('should negate the return value of a function', function () {
      assert.isFalse(_.not(function () { return true; })());
      assert.isFalse(_.not(function () { return 'valid'; })());
      assert.isFalse(_.not(_.isObject({ })));
      
    });
    it('should negate the value of any non-function', function () {
      assert.isTrue(_.not(false));
      assert.isFalse(_.not(true));
      assert.isFalse(_.not({ hello: 'world' }));
    });

  });
  describe('#test', function () {

    it('should validate number type predicate', function () {
      var template = {
          a: _.isNumber, 
          b: _.isNumber
        },
        object = {
          a: 1,
          b: 2.718
        };
      assert.isTrue(_.test(template, object));
    });
    it('should validate string type predicate', function () {
      var template = { a: _.isString },
        object = { a: 'hello' };
      assert.isTrue(_.test(template, object));
    });
    it('should validate null type predicate', function () {
      var template = { a: _.isNull },
        object = { a: null };
      assert.isTrue(_.test(template, object));
    });
    it('should validate list type predicate', function () {
      var template = { a: _.isArray },
        object1 = {
          a: [ ]
        },
        object2 = {
          a: [ 1, 2, 3 ]
        };
      assert.isTrue(_.test(template, object1));
      assert.isTrue(_.test(template, object2));
    });
    it('should validate list equality', function () {
      var template = { a: [1, 2, 3] },
        object = {
          a: [ 1, 2, 3 ]
        };
      assert.isTrue(_.test(template, object));
    });
    it('should validate custom list predicate true for all elements', function () {
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
      assert.isTrue(_.test(template, object));
    });
    it('should validate wildcard predicate for all values except undefined', function () {
      var template = {
        a: _.isDefined
      };

      assert.isTrue(_.test(template, { a: 'hello world' }));
      assert.isTrue(_.test(template, { a: { } }));
      assert.isTrue(_.test(template, { a: 123 }));
      assert.isTrue(_.test(template, { a: [1, 2, 3] }));
      assert.isTrue(_.test(template, { a: null }));
      assert.isTrue(_.test(template, { a: 0 }));
      assert.isTrue(_.test(template, { a: false }));

      assert.isFalse(_.test(template, { a: undefined }));
      assert.isFalse(_.test(template, { }));
    });
    it('should validate structure congruence', function () {
      var template1 = {
          a: _.isNumber, 
          foo: {
            bar: {
              b: _.isNumber
            }
          }
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
      assert.isTrue(_.test(template1, object));
      assert.isTrue(_.test(template2, object));
      assert.isTrue(_.test(template3, object));
    });

    it('should validate non-strict object predicate', function () {
      var template = { a: _.isObject };
      assert.isTrue(_.test(template, { a: [ ] }));
      assert.isTrue(_.test(template, { a: function () { } }));
    });

    it('should invalidate false list predicate', function () {
      var template = { a: _.isArray },
        object = { a: { } };
      assert.isFalse(_.test(template, object));
    });
    it('should invalidate false *strict* object predicate', function () {
      var template = { a: _.isObjectStrict };
      assert.isFalse(_.test(template, { a: [ ] }));
      assert.isFalse(_.test(template, { a: function () { } }));
    });
    it('should invalidate falsy predicate', function () {
      var template = { a: _.isString },
        object = { a: { } };
      assert.isFalse(_.test(template, object));
    });
    it('should invalidate value inequality', function () {
      var template = { a: 'hello' },
        object = { a: 'world' };
      assert.isFalse(_.test(template, object));
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
      assert.isFalse(_.test(template, object1));
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
      assert.isFalse(_.test(template, object));
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
      assert.isFalse(_.test(template, object));
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
      assert.isFalse(_.test(template, object));
    });
  });
  describe('examples', function () {
    it('should pass README example 1', function () {
        var validObject = {
            a: 3.1415926535,
            foo: {
              bar: {
                b: 'hello world',
                c: [ 1, 1, 2, 3, 5, 8 ],
                d: new Date()
              }
            }
          },
          matchingTemplate1 = {       // matches validObject
            a: _.isNumber, 
            foo: _.isObject
          },
          matchingTemplate2 = {       // matches validObject
            a: 3.1415926535,
            foo: {
              bar: {
                b: _.isString,
                c: _.isArray,
                d: _.not(_.isFunction)
              }
            }
          },
          failedTemplate1 = {         // does NOT match validObject
                                      // this template does not allow the 'a' property
            foo: {
              bar: _.isObject,
              hello: 'world'          // hello is not a supported property of 'foo'
            }
          },
          failedTemplate2 = {         // does NOT match validObject
            a: 3.1415926535,
            bar: {
              foo: {
                b: _.isString,
                c: _.isArray,
                d: _.not(_.isDate)
              }
            }
          };

        assert.isTrue(_.test(matchingTemplate1, validObject));
        assert.isTrue(_.test(matchingTemplate2, validObject));

        assert.isFalse(_.test(failedTemplate1, validObject));
        assert.isFalse(_.test(failedTemplate2, validObject));
    });

  });
});
