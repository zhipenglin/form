var assert = require('assert');
var Form=require('../src/index');

describe('Form#getFormValidateResult()',function(){
    describe('不包含用户自定义校验的简单校验',function(){
        var form=new Form();
        it('输入一组普通form表单值，校验通过',function(){
            return form.getFormValidateResult([
                {
                    name:'user_name',
                    value:'lzp',
                    rule:'req 3-10'
                },{
                    name:'pwd',
                    value:'aa1123',
                    rule:'req pwd'
                }
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',status:true,value:'lzp'},
                    {name:'pwd',status:true,value:'aa1123'}
                ],result);
            });
        });
        it('输入一组普通form表单值，某一项结果校验不通过',function(){
            return form.getFormValidateResult([
                {
                    name:'user_name',
                    value:'lzp',
                    rule:'req 5-10'
                },{
                    name:'pwd',
                    value:'aa1123',
                    rule:'req pwd'
                }
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',status:false,value:'lzp',msg:'%s必须大于5个字符'},
                    {name:'pwd',status:true,value:'aa1123'}
                ],result);
            });
        });
        it('输入一组普通form表单值，所有项结果校验不通过',function(){
            return form.getFormValidateResult([
                {
                    name:'user_name',
                    value:'lzp',
                    rule:'req 5-10'
                },{
                    name:'pwd',
                    value:'aa11',
                    rule:'req pwd'
                }
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',status:false,value:'lzp',msg:'%s必须大于5个字符'},
                    {name:'pwd',status:false,value:'aa11',msg:'请输入6-20位数字/字母'}
                ],result);
            });
        });
        it('输入一组空form表单值，所有项结果校验不通过',function(){
            return form.getFormValidateResult([]).then((result)=>{
                assert.deepEqual([],result);
            });
        });
    });
    describe('包含一个用户自定义异步校验字段的复杂校验',function(){
        it('输入一组form表单值，校验通过',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback(true);
                },50);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'18792833728',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'18792833728',status:true},
                    {name:'pwd',value:'72837288372',status:true}
                ],result);
            });
        });
        it('输入一组form表单值，校验不通过',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback({status:false,msg:'用户名已存在'});
                },50);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'18792833728',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'18792833728',status:false,msg:'用户名已存在'},
                    {name:'pwd',value:'72837288372',status:true}
                ],result);
            });
        });
        it('输入一组form表单值，类型校验不通过,远程校验不进行',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    assert.fail(null,null,'不应该执行到这一句');
                    callback(true);
                },50);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'1879283372',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'1879283372',status:false,msg:'请输入有效的手机号'},
                    {name:'pwd',value:'72837288372',status:true}
                ],result);
            });
        });
        it('输入一组form表单值，对同一字段添加多次远程校验，其中有一项校验失败',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback(true);
                },200);
            }).use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback({status:false,msg:'用户名已存在'});
                },0);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'18792833728',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'18792833728',status:false,msg:'用户名已存在'},
                    {name:'pwd',value:'72837288372',status:true}
                ],result);
            });
        });
        it('输入一组form表单值，对多个字段添加多次远程校验，其中有一项校验失败',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback(true);
                },200);
            }).use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback({status:false,msg:'用户名已存在'});
                },0);
            }).use('pwd',function(value,callback){
                setTimeout(()=>{
                    callback({status:true});
                },100);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'18792833728',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'18792833728',status:false,msg:'用户名已存在'},
                    {name:'pwd',value:'72837288372',status:true}
                ],result);
            });
        });
        it('输入一组form表单值，对多个字段添加多次远程校验，其中有多项校验失败',function(){
            var form=new Form();
            form.use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback(true);
                },200);
            }).use('user_name',function(value,callback){
                setTimeout(()=>{
                    callback({status:false,msg:'用户名已存在'});
                },0);
            }).use('pwd',function(value,callback){
                setTimeout(()=>{
                    callback({status:false,msg:'密码太过简单'});
                },100);
            });
            return form.getFormValidateResult([
                {name:'user_name',value:'18792833728',rule:'req tel'},
                {name:'pwd',value:'72837288372',rule:'req pwd'}
            ]).then((result)=>{
                assert.deepEqual([
                    {name:'user_name',value:'18792833728',status:false,msg:'用户名已存在'},
                    {name:'pwd',value:'72837288372',status:false,msg:'密码太过简单'}
                ],result);
            });
        });
    });
});