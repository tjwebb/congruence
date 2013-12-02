var _ = require('underscore'),
    assert = require('chai').assert;

_.mixin(require('../congruence'));

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
      assert.isFunction(_.not);
      assert.isFunction(_.or);
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
    describe('key expressions', function () {
      it('should interpret options array as an OR condition', function () {
        var template = {
            attr: [
              { $eq:    _.isDefined },
              { EQUALS: _.isDefined }
            ]
          },
          object1 = {   // OK
            attr: {
              $eq: 5
            }
          },
          object2 = {   // OK
            attr: {
              EQUALS: 5
            }
          },
          object3 = {   // FAIL
            attr: {
              foo: 'bar'
            }
          },
          errors1 = [ ],
          errors2 = [ ],
          errors3 = [ ];

        assert.isTrue(_.test(template, object1, errors1), _.pluck(errors1, 'message'));
        assert.lengthOf(errors1, 0);

        assert.isTrue(_.test(template, object2, errors2), _.pluck(errors2, 'message'));
        assert.lengthOf(errors2, 0);

        assert.isFalse(_.test(template, object3, errors3), _.pluck(errors3, 'message'));
        assert.lengthOf(errors3, 1);
      });
      it('should correctly handle 0+ key expression with options arrays', function () {
        var template = {
            attributes: {
              'children: 0+' : [
                { $eq: _.isDefined },
                { EQUALS: _.isDefined },
                { $lt: _.or(_.isNumber, _.isDate) },
                { LESS_THAN: _.or(_.isNumber, _.isDate) },
                { $gt: _.or(_.isNumber, _.isDate) },
                { GREATER_THAN: _.or(_.isNumber, _.isDate) }
              ]
            },
            orderby: {
              'children: 0+': _.or(_.isNumber, /ASC/i, /DESC/i)
            }
          },
          object1 = {   // OK
            attributes: {
              'order.number': { $eq: 1234 }
            }
          },
          object2 = {   // OK
            attributes: {
              amount: { $lt: 1000000000 },
              balance: { $gt: 0 }
            }
          },
          object3 = {   // OK
            attributes: {
              amount: { $lt: 1000000000 },
              balance: { GREATER_THAN: 0 }
            },
            orderby: {
              amount: -1,
              balance: 'asc'
            }
          },
          object4 = {   // FAIL
            attributes: {
              amount: { $lt: 1000000000 },
              balance: { GREATHER_THAN: 0 },
              extra: { $gt: 'hamburger' }
            },
            orderby: {
              amount: -1
            }
          },
          object5 = {   // FAIL
            attributes: {
              amount: { $lt: 1000000000 },
              balance: { GREATHER_THAN: 0 },
            },
            orderby: {
              amount: 'invalid'
            }
          },
          errors1 = [ ],
          errors2 = [ ],
          errors3 = [ ],
          errors4 = [ ],
          errors5 = [ ];

        assert.isTrue(_.test(template, object1, errors1), JSON.stringify(errors1));
        assert.lengthOf(errors1, 0);

        assert.isTrue(_.test(template, object2, errors2), JSON.stringify(errors2));
        assert.lengthOf(errors2, 0);

        assert.isTrue(_.test(template, object3, errors3), JSON.stringify(errors3));
        assert.lengthOf(errors3, 0);

        assert.isFalse(_.test(template, object4, errors4), JSON.stringify(errors4));
        assert.lengthOf(errors4, 1);

        assert.isFalse(_.test(template, object5, errors5), JSON.stringify(errors5));
        assert.lengthOf(errors5, 1);
      });
      it('should correctly handle 1+ key expression with options arrays', function () {
        var template = {
            attributes: {
              'children: 1+' : [
                { $eq: _.isDefined },
                { EQUALS: _.isDefined },
                { $lt: _.or(_.isNumber, _.isDate) },
                { LESS_THAN: _.or(_.isNumber, _.isDate) },
              ]
            },
            orderby: {
              'children: 0+': _.or(_.isNumber, /ASC/i, /DESC/i)
            }
          },
          object1 = {   // OK
            attributes: {
              'order.number': { $eq: 1234 }
            },
            orderby: {
              amount: 'ASC'
            }
          },
          object2 = {   // FAIL
            orderby: {
              amount: 'ASC'
            }
          },
          errors1 = [ ],
          errors2 = [ ];

        assert.isTrue(_.test(template, object1, errors1), JSON.stringify(errors1));
        assert.lengthOf(errors1, 0);

        assert.isFalse(_.test(template, object2, errors2), JSON.stringify(errors2));
        assert.lengthOf(errors2, 1);
      });
    });
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
      var template = {
          a: _.partial(_.isEqual, [1, 2, 3])
        },
        object = {
          a: [ 1, 2, 3 ]
        };
      assert.isTrue(_.test(template, object));
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
            foo: {
              bar: {
                b: _.isString,
                c: _.isArray,
                d: _.not(_.isFunction)
              }
            }
          },
          failedTemplate1 = {
                                      // this template does not allow the 'a' property
            foo: {
              bar: _.isObject,
              hello: 'world'          // hello is not a supported property of 'foo'
            }
          },
          failedTemplate2 = {
            a: _.not(_.isNumber),     // object.a = 3.14... is a number
            bar: {                    // object structure is foo.bar, not bar.foo
              foo: {
                b: _.isString,
                c: _.isArray,
                d: _.isDate
              }
            }
          },
          errors1 = [ ];

        assert.isTrue(_.test(matchingTemplate1, object, errors1), JSON.stringify(errors1));
        assert.isTrue(_.test(matchingTemplate2, object));

        assert.isFalse(_.test(failedTemplate1, object));
        assert.isFalse(_.test(failedTemplate2, object));
    });
  });
});
