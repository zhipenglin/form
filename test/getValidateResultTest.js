var assert = require('assert');
var Form=require('../dist/form');
describe('Form#getValidateResult()', function() {
    describe('必须性校验',function(){
        var form=new Form();
        it('输入正常字符串，执行必须性校验，验证通过', function() {
            return form.getValidateResult('user_name','lzp','req').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzp'},resules);
            })
        });
        it('输入null，执行必须性校验，验证不通过', function() {
            return form.getValidateResult('user_name',null,'req').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:null,msg:'%s不能为空'},resules);
            })
        });
        it('输入undefined，执行必须性校验，验证不通过', function() {
            return form.getValidateResult('user_name',undefined,'req').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:undefined,msg:'%s不能为空'},resules);
            })
        });
        it('输入true，执行必须性校验，验证通过', function() {
            return form.getValidateResult('user_name',true,'req').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:true},resules);
            })
        });
        it('输入false，执行必须性校验，验证通过', function() {
            return form.getValidateResult('user_name',false,'req').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:false},resules);
            })
        });
        it('输入数字0，执行必须性校验，验证通过', function() {
            return form.getValidateResult('user_name',0,'req').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:0},resules);
            })
        });
    });
    describe('长度校验',function(){
        var form=new Form();
        it('输入字符串，执行必须性校验和长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzp','req 0-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzp'},resules);
            });
        });
        it('输入字符串小于校验长度，执行必须性校验和长度校验，验证不通过',function(){
            return form.getValidateResult('user_name','lzp','req 5-12').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'lzp',msg:'%s必须大于5个字符'},resules);
            });
        });
        it('输入字符串大于校验长度，执行必须性校验和长度校验，验证不通过',function(){
            return form.getValidateResult('user_name','lzppppppppppp','req 5-12').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'lzppppppppppp',msg:'%s必须小于12个字符'},resules);
            });
        });
        it('输入字符串等于上边界长度，执行必须性校验和长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzppp','req 5-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzppp'},resules);
            });
        });
        it('输入字符串等于下边界长度，执行必须性校验和长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzpppppppppp','req 5-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzpppppppppp'},resules);
            });
        });
        it('输入字符串等于边界长度，执行必须性校验和边界长度相等的长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzppp','req 5-5').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzppp'},resules);
            });
        });
        it('输入字符串小于边界长度，执行必须性校验和边界长度相等的长度校验，验证不通过',function(){
            return form.getValidateResult('user_name','lzp','req 5-5').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'lzp',msg:'%s必须为5个字符'},resules);
            });
        });
        it('输入字符串大于边界长度，执行必须性校验和边界长度相等的长度校验，验证不通过',function(){
            return form.getValidateResult('user_name','lzpppp','req 5-5').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'lzpppp',msg:'%s必须为5个字符'},resules);
            });
        });
        it('输入字符串小于边界长度，执行必须性校验和只有上边界的长度校验，验证不通过',function(){
            return form.getValidateResult('user_name','lzp','req 5').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'lzp',msg:'%s必须大于5个字符'},resules);
            });
        });
        it('输入字符串等于边界长度，执行必须性校验和只有上边界的长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzppp','req 5').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzppp'},resules);
            });
        });
        it('输入字符串大于于边界长度，执行必须性校验和只有上边界的长度校验，验证通过',function(){
            return form.getValidateResult('user_name','lzppppp','req 5').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'lzppppp'},resules);
            });
        });
        it('输入空字符串，执行长度校验，验证通过',function(){
            return form.getValidateResult('user_name','','0-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:''},resules);
            });
        });
        it('输入null，执行长度校验，验证通过',function(){
            return form.getValidateResult('user_name',null,'0-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:null},resules);
            });
        });
        it('输入undefined，执行长度校验，验证通过',function(){
            return form.getValidateResult('user_name',undefined,'0-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:undefined},resules);
            });
        });
        it('输入数字0，执行长度校验，验证通过',function(){
            return form.getValidateResult('user_name',0,'5-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:0},resules);
            });
        });
        it('输入数字任意数字，执行长度校验，验证通过',function(){
            return form.getValidateResult('user_name',122,'5-12').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:122},resules);
            });
        });
    });
    describe('类型校验',function(){
        var form=new Form();
        it('输入字符串，执行type为手机号校验，验证不通过',function(){
            return form.getValidateResult('user_name','18782232','tel').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'18782232',msg:'请输入有效的手机号'},resules);
            });
        });
        it('输入字符串，执行type为手机号校验，验证通过',function(){
            return form.getValidateResult('user_name','18928377283','tel').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'18928377283'},resules);
            });
        });
        it('输入字符串，执行type为email校验，验证不通过',function(){
            return form.getValidateResult('user_name','sdasdd','email').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'sdasdd',msg:'请输入有效的邮箱'},resules);
            });
        });
        it('输入字符串，执行type为email校验，验证通过',function(){
            return form.getValidateResult('user_name','sdasdd@sd.sdsd','email').then((resules)=>{
                assert.deepEqual({status:true,name:'user_name',value:'sdasdd@sd.sdsd'},resules);
            });
        });
        it('输入字符串长度大于边界，执行必须性 长度 type为email校验，验证通过',function(){
            return form.getValidateResult('user_name','sdasdd@sd.sdsd','req 5-10 email').then((resules)=>{
                assert.deepEqual({status:false,name:'user_name',value:'sdasdd@sd.sdsd',msg:'%s必须小于10个字符'},resules);
            });
        });
    });
    describe('自定义异步校验',function(){
        var form=new Form();
        form.use('user_name',function(value,callback){
            setTimeout(()=>{
                if(value==='123'){
                    callback(true);
                }else{
                    callback({status:false,msg:'结果!=123'});
                }
            },500);
        });
        it('输入任意字符串，执行用户自定义校验',function(){
            return form.getValidateResult('user_name','sss','req').then((results)=>{
                assert.deepEqual({status:false,name:'user_name',value:'sss',msg:'结果!=123'},results);
            });
        });
        it('输入字符串123，执行用户自定义校验',function(){
            return form.getValidateResult('user_name','123','req').then((results)=>{
                assert.deepEqual({status:true,name:'user_name',value:'123'},results);
            });
        });
    });
});