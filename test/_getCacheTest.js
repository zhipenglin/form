var assert = require('assert');
var Form=require('../dist/form');

describe('Form#_getCache()',function(){
    var form=new Form();
    it('进行一次校验，然后查看该字段的缓存',function(){
        return form.getValidateResult('user_name','18782733827','req tel').then((result)=>{
            assert.deepEqual({status:true,name:'user_name',value:'18782733827'},form._getCache('user_name','18782733827','req tel'));
        });
    });
});