# Form

[详细文档](https://zhipenglin.github.io/form/docs)

## 特性
* UI逻辑与验证逻辑完全分离，UI逻辑可以根据需求灵活定制，可以进行jquery，react等多种UI框架或场景的适配
* 验证逻辑的全测试用例，确保安全稳定
* 功能强大，提供了一套，动态的，异步的校验机制，通过hashCode标记每一次校验的缓存，保证了相同条件的校验只被执行一次，提高性能。

## 校验机制
每个字段依次进行以下4部校验：
1. 必须性校验
2. 长度校验
3. 类型校验
4. 自定义校验（一般用于异步远程校验）
校验完成后返回一个Promise对象，可以在校验完成后取得校验结果对象:
```js
{status:是否通过校验,msg:错误字符串模版,value:字段当前值,name:字段名称}
```

## 验证表达式
通过一个有规则的字符串解析出一组校验规则，验证表达式一般包含以下几个部分
* req 表达式中包含它，说明需要进行必须性校验
* {number}-{number} 表达是包含它说明需要进行长度校验，它一般有三种形式，例如：1-20表示允许1-20个字符 0-20表示必须小于20字符 20表示必须大于20字符
* {type} 表达式中包含它，说明需要进行类型校验，{type}必须可以在默认rules或者用户参数传入的rules里找到，可以有多个，任意一个规则失败会导致类型校验失败

下面举几个例子说明：
1. 'req 5-10 email' 该表达式表示：该字段必填，允许5-10个字符，格式必须为email
2. 'tel' 该表达式表示：该字段不必填，格式必须为tel（手机号）
3. 'req 6 pwd' 该表达式表示：该字段必填，必须大于等于6个字符，格式必须为pwd

## 自定义校验
自定义校验通过use方法追加，在某一字段进行完表达式验证并且通过之后，如果发现有追加的自定义校验方法，则按照追加顺序依次开始执行自定义校验。
同一字段可以追加多个自定义校验，他们并行执行，当某一个方法返回结果不通过，则立即返回结果对象，当所有方法全部通过，返回结果对象

下面举例说明：
```js
form.use('user_name',function(value,callback){
    setTimeout(function(){
        if(value.indexOf('123').length>-1){
            callback(true);
        }else{
            callback({status:false,msg:'用户名未注册'});
        }
    },1000);
}).use('user_name',function(value,callback){
    setTimeout(function(){
        if(value.indexOf('56').length>-1){
            callback(true);
        }else{
            callback({status:false,msg:'用户名不合法'});
        }
    },50);
});
```
以上例子将对user_name字段执行两次校验，如果value为1234，则50ms后返回{status:false,value:'1234',name:'user_name',msg:'用户名不合法'}结果。

如果value为4567则1000ms后返回{status:false,value:'1234',name:'user_name',msg:'用户名未注册'}结果。

如果value为1234567则1000ms后返回{status:true,value:'1234',name:'user_name'}结果

## 缓存
每次执行完校验的结果都会通过（字段名，值，验证表达式）计算出一个hashCode，当且仅当hashCode相等时（即字段名，值，验证表达式完全相等）直接返回缓存中的校验结果

可以通过clearFieldCache clearAllCache方法来删除已有缓存

## 事件
可以通过on方法进行事件绑定，传入name则表示只监听name字段触发的事件，不传入name则表示监听所有字段触发的事件

eventName有以下几种
1. pass 校验完成并且通过触发该事件
2. loading 开始执行用户自定义校验触发该事件
3. error 校验完成且不通过触发该事件