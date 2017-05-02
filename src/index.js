var _=require('lodash');

const RULES={
    tel:{
        regExp:/^1[0-9]{10}$/,
        des:'请输入有效的手机号'
    },
    email:{
        regExp:/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        des:'请输入有效的邮箱'
    },
    pwd:{
        regExp:/^[a-zA-Z0-9]{6,20}$/,
        des:'请输入6-20位数字/字母'
    }
};

const EVENT_ALL=263;

module.exports=class{
    constructor(options){
        /**
         * cache用来储存校验字段的当前校验状态，以便下次同一校验字段进行校验时直接从cache中取得校验结果
         * */
        this._cache={};
        this._ruleCache={};
        /**
         * events用来储存使用者对表单校验状态改变事件的监听的回调函数
         *
         * event type说明:
         *
         * 1.all所有类型都执行回调函数
         * 2.error校验中出现校验不通过情况，触发该事件，返回错误提示字符串，终止该字段的剩余校验过程
         * 3.loading校验字段中存在用户自定义校验，并且调用用户自定义校验函数返回promise对象，触发该事件
         * 4.pass执行校验的字段完成了所有的校验，并且全部通过校验
         * */
        this._events={};
        /**
         * middlewares用来储存使用者追加自定义表单校验规则的回调函数
         * */
        this._middlewares={};
    }
    getValidateResult(name,value,rule){
        var cache=this._getCache(name,value);
        if(cache.status!==undefined){
            return cache;
        }
        rule=this._getRule(rule);
        var returnResult=(result)=>{
            result.name=name;
            result.value=value;
            cache.result=result;
            if(result.status===true){
                this._triggerEvent('pass', name, value);
            }else if(result.status===false&&result.loading===true){
                this._triggerEvent('loading', name, value);
            }else{
                this._triggerEvent('error', name, value);
            }
            return Promise.resolve(result);
        };
        //空性判断
        if(this._isEmpty(value)){
            if(rule.req){
                return returnResult({status:false,msg:'%s不能为空'});
            }else{
                return returnResult(cache.result={status:true});
            }
        }
        //长度判断
        if(value.length!=undefined&&rule.length&&rule.length.start){
            if(rule.length.start===rule.length.end&&value.length!==rule.length.start){
                return returnResult({status:false,msg:`%s必须为${rule.length.start}个字符`});
            }
            if(value.length<rule.length.start){
                return returnResult({status:false,msg:`%s必须大于${rule.length.start}个字符`});
            }
            if(rule.length.end&&value.length>rule.length.end){
                return returnResult({status:false,msg:`%s必须小于${rule.length.end}个字符`});
            }
        }
        //类型判断
        if(rule.type&&rule.type.length>0){
            for(let key of rule.type){
                let ruleType=RULES[key];
                if(ruleType&&ruleType.func&&typeof ruleType.func=='function'&&!ruleType.func(value)){
                    return returnResult({status:false,msg:ruleType.des});
                }else if(ruleType&&ruleType.regExp&&ruleType.regExp instanceof RegExp&&!ruleType.regExp.test(value)){
                    return returnResult({status:false,msg:ruleType.des});
                }
            }
        }
        //用户自定义规则判断
        var extraList=this._middlewares[name];
        if(extraList&&extraList.length>0) {
            returnResult({status:false,loading:true});
            return Promise.all(extraList.map((extra)=>{
                if(typeof extra=='function'){
                    return new Promise((reslove,reject)=>{
                        extra(value,(result)=>{
                            if(result===true||result.status===true){
                                reslove(result);
                            }else{
                                reject(result);
                            }
                        });
                    });
                }
            })).then(()=>{
                return returnResult({status:true});
            },(result)=>{
                return returnResult(result);
            });
        }else{
            return returnResult({status:true});
        }
    }
    getFormValidateResult(dataArray){
        return Promise.all(dataArray.map((field)=>{
            return this.getValidateResult(field.name,field.value,field.rule);
        }));
    }
    isError(name){
        if(name){
            return this._cache[name].status===false&&this._cache[name].loading!==true;
        }
        return this._find(this._cache,(result)=>result.status===false&&result.loading!==true);
    }
    isLoading(name){
        if(name){
            return this._cache[name].status===false&&this._cache[name].loading===true;
        }
        return this._find(this._cache,(result)=>result.status===false&&result.loading===true);
    }
    isPass(name){
        if(name){
            return this._cache[name].status===true;
        }
        return this._every(this._cache,(result)=>result.status===true);
    }
    clearFieldCache(name){
        if(this._cache[name]){
            delete this._cache[name];
        }
    }
    clearAllCache(){
        this._cache={};
    }
    on(eventName,...args){
        var name=args[0],callback=args[args.length-1];
        if(typeof name!=='string'){
            name=EVENT_ALL;
        }
        if(typeof callback!=='function'){
            return;
        }
        if(!this._events[eventName]){
            this._events[eventName]={};
        }
        if(!this._events[eventName][name]){
            this._events[eventName][name]=[];
        }
        this._events[eventName][name].push(callback);
    }
    off(eventName,name){
        if(name){
            if(this._events[eventName][name]){
                this._events[eventName][name]=[];
            }
        }else{
            this._events[eventName]={};
        }
    }
    use(name,callback){
        if(typeof name!=='string'||typeof callback!=='function'){
            return;
        }

        if(!this._middlewares[name]){
            this._middlewares[name]=[];
        }
        this._middlewares[name].push(callback);
    }
    _getCache(name,value){
        var hashCode=(function(key){
            //djb2HashCode
            var hash=5381;
            for(var i=0;i<key.length;i++){
                hash=hash*33+key.charCodeAt(i);
            }
            return hash%1013;
        })(JSON.stringify({[name]:value}));
        if(this._cache[hashCode]&&this._cache[hashCode].loading!==true){
            return this._cache[hashCode];
        }else{
            return {};
        }
    }
    _getRule(rule=''){
        if(this._ruleCache[rule]){
            return this._ruleCache[rule];
        }
        var _rule={};
        rule.split(' ').forEach((n)=>{
            if(/^required|req$/i.test(n)){
                _rule.req=true;
            }else if(/^[0-9]+(-[0-9]+)?$/.test(n)){
                if(_rule.length===undefined){
                    let [start,end]=n.split('-');
                    let length={start:parseInt(start)};
                    if(end){
                        end=parseInt(end);
                        if(start<=end){
                            length.end=end;
                            _rule.length=length;
                        }
                    }else{
                        _rule.length=length;
                    }
                }
            }else if(RULES[n]){
                if(!_rule.type){
                    _rule.type=[];
                }
                _rule.type.push(n);
            }
        });
        return this._ruleCache[rule]=_rule;
    }
    _isEmpty(value){
        return value===undefined||value===null||value===''||value.length==0||this._isEmptyObject(value);
    }
    _isEmptyObject(value) {
        return _.isObject(value)&&_.isEmpty(value);
    }
    _triggerEvent(eventType,name,value){
        if(this._events[eventType]){
            if(this._events[eventType][name]){
                this._events[eventType][name](value,eventType,name);
                this._events[eventType][EVENT_ALL](value,eventType,name);
            }
        }
    }
    _find(array,callback){
       return _.find(array,callback);
    }
    _every(array,callback){
        return _.every(array,callback);
    }
}