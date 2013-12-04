var _ = require('underscore'),
  assert = require('chai').assert,
  moment = require('moment');

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

  describe('#or()', function () {
    it('should return a function that returns the _.any of the given arguments', function () {
      var or1 = _.or(_.isUndefined, _.isString, _.isFunction);
      assert.isTrue(or1('hello'));
      assert.isTrue(or1(function () { }));
      assert.isTrue(or1(undefined));

      assert.isFalse(or1(null));
      assert.isFalse(or1({ }));
    });
  });
  describe('#not()', function () {
    it('should negate the return value of a function', function () {
      assert.isFalse(_.not(function () { return true; })(true));
      assert.isFalse(_.not(function () { return 'valid'; })('valid'));
      
    });
    it('should negate the value of any non-function', function () {
      assert.isTrue(_.not(false)(true));
      assert.isTrue(_.not(true)(false));
      assert.isFalse(_.not({ hello: 'world' })({ hello: 'world' }));
    });

  });
  describe('#test', function () {
    describe('key expressions', function () {
      it('should interpret options array as an OR condition', function () {
        var template = {
            attr: _.or(
              { $eq:    _.isDefined },
              { EQUALS: _.isDefined }
            )
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
          };

        assert.isTrue(_.test(template, object1));
        assert.isTrue(_.test(template, object2));
        assert.isFalse(_.test(template, object3));
      });
      it('should correctly handle 0+ key expression', function () {
        var template = {
            '(?)attributes': {
              '(+)' : _.or(
                { $eq: _.isDefined },
                { EQUALS: _.isDefined },
                { $lt: _.or(_.isNumber, _.isDate) },
                { LESS_THAN: _.or(_.isNumber, _.isDate) },
                { $gt: _.or(_.isNumber, _.isDate) },
                { GREATER_THAN: _.or(_.isFinite, _.isDate) }
              )
            },
            '(?)orderby': {
              '(+)': _.or(_.isNumber, /ASC/i, /DESC/i)
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
              extra: { noexist: 'hamburger' }
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
          };

        assert.isTrue(_.test(template, object1));
        assert.isTrue(_.test(template, object2));
        assert.isTrue(_.test(template, object3));
        assert.isFalse(_.test(template, object5));
        assert.isFalse(_.test(template, object4));
      });
      it('should correctly handle 1+ key expression with options arrays', function () {
        var template = {
            '(?)attributes': {
              '(+)' : _.or(
                { $eq: _.isDefined },
                { EQUALS: _.isDefined },
                { $lt: _.or(_.isNumber, _.isDate) },
                { LESS_THAN: _.or(_.isNumber, _.isDate) }
              )
            },
            '(?)orderby': {
              '(+)': _.or(_.isNumber, /ASC/i, /DESC/i)
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
          };

        assert.isTrue(_.test(template, object1));
        assert.isTrue(_.test(template, object2));
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
    it('should validate missing object key but which is allowed undefined by template', function () {
      var template = {
          a: _.isNumber, 
          b: _.or(_.isUndefined, _.isNumber)
        },
        object = {
          a: 1
        };
      assert.isTrue(_.test(template, object));

    });
  });
  describe('#isValidDate()', function () {
    it('should correctly validate input against given format list', function () {
      var date1 = '12/3/2013',
        date2 = '12/03/2013',
        date3 = '12/3/13',
        date4 = '31/31/2013',           // FAIL
        date5 = new Date().valueOf(),   // FAIL
        date6 = new Date().toString(),
        formats = [
          'MM/DD/YY',
          'MM/DD/YYYY',
          moment.defaultFormat
        ];

      assert.isTrue(_.isValidDate(formats)(date1));
      assert.isTrue(_.isValidDate(formats)(date2));
      assert.isTrue(_.isValidDate(formats)(date3));

      assert.isFalse(_.isValidDate(formats)(date4));
      assert.isFalse(_.isValidDate(formats)(date5));

      assert.isTrue(_.isValidDate(formats)(date6));

    });
    it('should validate date type predicate', function () {
      var template = {
          date1: _.isValidDate([ 'MM/DD/YY' ]),
          date2: _.isValidDate([ 'MM/DD/YYYY' ])
        },
        object = {
          date1: '12/03/13',
          date2: '12/03/2013'
        };

      assert.isTrue(_.test(template, object));
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
          };

        assert.isTrue(_.test(matchingTemplate1, object));
        assert.isTrue(_.test(matchingTemplate2, object));

        assert.isFalse(_.test(failedTemplate1, object));
        assert.isFalse(_.test(failedTemplate2, object));
    });
  });
});
