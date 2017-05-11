var assert = require('assert');
var Form=require('../dist/form');

describe('Form#isEmpty()',function(){
    var form=new Form();
    it('输入null，结果为true', function() {
        assert.equal(true,form.isEmpty(null));
    });
    it('输入undefined，结果为true', function() {
        assert.equal(true,form.isEmpty(undefined));
    });
    it('输入false，结果为false', function() {
        assert.equal(false,form.isEmpty(false));
    });
    it('输入0，结果为false', function() {
        assert.equal(false,form.isEmpty(0));
    });
    it('输入空字符串，结果为true', function() {
        assert.equal(true,form.isEmpty(''));
    });
    it('输入非空字符串，结果为false', function() {
        assert.equal(false,form.isEmpty('aaa'));
    });
    it('输入空数组，结果为true', function() {
        assert.equal(true,form.isEmpty([]));
    });
    it('输入非空数组，结果为false', function() {
        assert.equal(false,form.isEmpty([1,2,3]));
    });
    it('输入空对象，结果为true', function() {
        assert.equal(true,form.isEmpty({}));
    });
    it('输入非空对象，结果为false', function() {
        assert.equal(false,form.isEmpty({a:123}));
    });
});