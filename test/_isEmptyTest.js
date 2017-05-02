var assert = require('assert');
var Form=require('../src/index');

describe('Form#_isEmpty()',function(){
    var form=new Form();
    it('输入null，结果为true', function() {
        assert.equal(true,form._isEmpty(null));
    });
    it('输入undefined，结果为true', function() {
        assert.equal(true,form._isEmpty(undefined));
    });
    it('输入false，结果为false', function() {
        assert.equal(false,form._isEmpty(false));
    });
    it('输入0，结果为false', function() {
        assert.equal(false,form._isEmpty(0));
    });
    it('输入空字符串，结果为true', function() {
        assert.equal(true,form._isEmpty(''));
    });
    it('输入非空字符串，结果为false', function() {
        assert.equal(false,form._isEmpty('aaa'));
    });
    it('输入空数组，结果为true', function() {
        assert.equal(true,form._isEmpty([]));
    });
    it('输入非空数组，结果为false', function() {
        assert.equal(false,form._isEmpty([1,2,3]));
    });
    it('输入空对象，结果为true', function() {
        assert.equal(true,form._isEmpty({}));
    });
    it('输入非空对象，结果为false', function() {
        assert.equal(false,form._isEmpty({a:123}));
    });
});