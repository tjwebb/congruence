congruence
==========

[![NPM version][npm-image]][npm-url]
![License][npm-license]
[![Build status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]

Validate Javascript objects using semantic templates. Written as an underscore/lodash mixin.

## Install

```sh
$ npm install congruence --save
```

## Introduction

```js
_.mixin(require('congruence'));
var template = { module: _.isString,   version: semver.valid };
var object =   { module: 'abc', version: 'v1.0.0'     };
assert.isTrue(_.congruent(template, object));
```

Above, the object is **congruent** to the template because `object.module` is a
string, and `semver.valid`[[1]](https://www.npmjs.org/package/semver) returns
true for `object.version`.
    
It's like regular expressions for Javascript objects. Easily test the structure
of Javascript objects using expressive templates. Designed as an lodash mixin.

## Usage

Use this module to check the congruence of Javascript structures and validity
of values using semantic templates. Suppose an object:

```js
var obj = {
  megahertz: 266,
  message: 'hello world'
};
```

We use the built-in lodash matching functions to build a template
(an isometry) that we can validate against. Here is a template that matches
`obj` above:

```js
var matchingTemplate = {
  megahertz: _.isNumber
  message: _.isString
};
```

But this will not match:
  
```js
var failedTemplate = {
  megahertz: 500,
  foo: _.isFunction
};
```

Both properties will fail validation. 
If a non-function is given in the template value, it will be used as a strict
equality check. `megahertz` is not equal to `500` so that fails. And the
template requires `foo` to be a function, but `obj.foo` is not even defined.


Any lodash `isXYZ` function can be used as a predicate; you can also define your own, e.g.
        
```js
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

## Examples

### A. Simple Template Congruence
  
```js
var object = {
  a: 3.1415926535,
  foo: {
    bar: {
      b: 'hello world',
      c: [ 1, 1, 2, 3, 5, 8 ],
      d: new Date()
    }
  }
};
var matchingTemplate = {
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

```js
var template = {
  id: 57,
  name: 'Travis'
};
var object = {
  id: 57,
  name: 'Travis',
  color: 'blue',
  foo: 1
};

// the extra object properties are ignored
assert.isTrue(_.similar(template, object));
```

## 3. Full Lodash API

#### `_.congruent(template, object)`
Return true if the object matches all of the conditions in the specified template, and the keysets are identical.

| @param | description
|:--|:--|
| template | the congruence template used to validate the object
| object | the object to validate
| **@return** | **description**
| Boolean | true if the object is congruent to the template, false otherwise

```js
var template = {
  <key>: <predicate>
};
var object = {
  <key>: <value>
};

_.congruent(template, object);
```
        
#### `_.similar(template, object)`
Return true if the object matches all the conditions specified by the template.

| @param | description
|:--|:--|
| template | the congruence template used to validate the object
| object | the object to validate
| **@return** | **description**
| Boolean | true if the object is congruent to the template, false otherwise

```js
var template = {
  <key>: <predicate>
};
var object = {
  <key>: <value>
};
```

## License
MIT

[npm-image]: https://img.shields.io/npm/v/congruence.svg?style=flat-square
[npm-url]: https://npmjs.org/package/congruence
[npm-license]: https://img.shields.io/npm/l/congruence.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/tjwebb/congruence.svg?style=flat-square
[travis-url]: https://travis-ci.org/tjwebb/congruence
[daviddm-image]: http://img.shields.io/david/tjwebb/congruence.svg?style=flat-square
[daviddm-url]: https://david-dm.org/tjwebb/congruence
