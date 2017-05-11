import Form from './form'
import _ from 'lodash'
import $ from 'jquery'

/**
 * 用于jquery的UI逻辑封装
 * */
class JForm {
    /**
     * @param {Element} $el 被绑定的元素
     * @param {Object} options 配置参数
     * @param {string} options.fieldClass 字段选择器，用来标识一个字段
     * @param {string} options.containerClass 字段容器选择器，用来标识字段容器，字段校验状态会添加到字段容器上
     * @param {string} options.msgClass 字段错误信息容器选择器，用来标识字段错误信息容器，字段验证后的错误信息会显示在字段错误信息容器里面
     * @param {string} options.errorClass 字段错误状态标识，用来把错误状态添加到字段容器上
     * @param {bool} options.nullError 未提交表单时是否认为空状态是错误
     * @param {function} options.callback 提交表单即调用submit方法时，表单所有字段验证通过调用该方法，参数为表单的值
     * @param {number} options.delayTime 用户连续输入间隔多久进行下一次校验
     * @param {bool} options.realTimeError 是否实时显示错误信息
     * @param {Object} options.rules 自定义校验规则 参考Form里的相同参数
     * @param {string} options.reqErrorTemp 空错误错误信息模版 参考Form里的相同参数
     * @param {function} options.lengthErrorTempFunc 长度校验错误信息模版方法 参考Form里的相同参数
     * */
    constructor($el,options){
        this.$el=$($el);
        this.options=_.merge({},{
            fieldClass:'J_form-field',
            containerClass:'J_form-container',
            msgClass:'J_form-msg',
            msgErrorClass:'is-error',
            errorClass:'form-error',
            nullError:false,
            callback:null,
            delayTime:500,
            realTimeError:true
        },options);
        this._form=new Form({
            rules:this.options.rules,
            reqErrorTemp:this.options.reqErrorTemp,
            lengthErrorTempFunc:this.options.lengthErrorTempFunc
        });
        this._bindEvent();
    }
    /**
     * 提交表单，如果有没有验证的字段则进行校验，所有字段均被校验并且全部都验证通过后执行options.callback，如果callback参数存在则执行callback，不执行options.callback
     * @param {function} callback 所有字段验证通过后调用该方法，如果该方法返回值为false，则放弃执行options.callback方法
     * @return {Promise} Promise对象，在then中可以传入验证全部结束回调
     * */
    submit(callback){
        return Promise.all([].map.call(this.$el.find(`.${this.options.fieldClass}`),(target)=>{
            return this.validate(target);
        })).then((results)=>{
            var allPass=true,data={};
            results.forEach((result)=>{
                this._setError(result,true);
                if(result.status===true){
                    data[result.name]=result.value;
                }else{
                    allPass=false;
                }
            });
            if(allPass){
                if(!(callback&&callback(data)===false)){
                    this.options.callback&&this.options.callback(data);
                }
            }
            return {pass:allPass,data}
        });
    }
    /**
     * 向某个字段错误状态和信息
     * @param {name} 字段名
     * @param {msg} 错误信息
     * @return {JForm} JForm对象
     * */
    setError(name,msg){
        this._setError({status:false,name,msg,value:this.getFieldValue(name)});
        return this;
    }
    /**
     * 同Form.prototype.use
     * @return {JForm} JForm对象
     * */
    use(...args){
        this._form.use(...args);
        return this;
    }
    /**
     * 同Form.prototype.on
     * @return {JForm} JForm对象
     * */
    on(...args){
        this._form.on(...args);
        return this;
    }
    /**
     * 同Form.prototype.isLoading
     * */
    isLoading(name){
        return this._form.isLoading(name);
    }
    /**
     * 同Form.prototype.isError
     * */
    isError(name){
        return this._form.isError(name);
    }
    /**
     * 同Form.prototype.isPass
     * */
    isPass(name){
        return this._form.isPass(name);
    }
    /**
     * 对一个字段进行验证
     * @param {Element} target 字段元素
     * @return {Object} 验证结果对象
     * */
    validate(target){
        var $target=$(target);
        var name=$target.attr('name'),value=this._getTargetValue(target),rule=$target.attr('rule');
        return this._form.getValidateResult(name,value,rule);
    }
    /**
     * 获取某个字段当前的值
     * @param {string} name 字段名
     * @reutrn {Anything} 字段当前值
     * */
    getFieldValue(name){
        return this._getTargetValue(this.$el.find(`.${this.options.fieldClass}[name="${name}"]`));
    }
    /**
     * 给表单中的某个字段赋值
     * @param {string} name 字段名
     * @param {Anything} value  字段的值
     * @return {JForm} JForm对象
     * */
    setFieldValue(name,value){
        this._setTargetValue(this.$el.find(`.${this.options.fieldClass}[name="${name}"]`),value);
        return this;
    }
    /**
     * 给整个表单赋值
     * @param {Object} data 表单值
     * @return {JForm} JForm对象
     * */
    setFormData(data){
        _.each(data,(value,name)=>this.setFieldValue(name,value));
        return this;
    }
    /**
     * 清除表单校验缓存
     * @param {string} name 表单值（可选）当没有传入name时，清除整个表单缓存，当传入name时只清除该字段的缓存
     * @return {JForm} JForm对象
     * */
    clear(name){
        if(name){
            this._form.clearFieldCache(name);
        }else{
            this._form.clearAllCache();
        }
    }
    _setError(result,fromSubmit){
        var $outer=this.$el.find(`.${this.options.containerClass}_${result.name}`),
            $msg=this.$el.find(`.${this.options.msgClass}_${result.name}`),
            $field=this.$el.find(`.${this.options.fieldClass}[name="${result.name}"]`),
            label=$field.attr('label');
        if($outer.length==0){
            $outer=$field;
        }
        if(result.status===true||(!fromSubmit&&!this.options.nullError&&this._form.isEmpty(result.value))){
            $outer.removeClass(this.options.errorClass);
            $msg.removeClass(this.options.msgErrorClass).html('');
        }else{
            $outer.addClass(this.options.errorClass);
            $msg.addClass(this.options.msgErrorClass).html(result.msg.replace('%s',label||'该字段'));
        }
        return this;
    }
    _setTargetValue(target,value){
        var $target=$(target),name=$target.attr('name');
        if($target.is('[data-value]')||$target.data('value')!==undefined||$target.is('div')){
            $target.data('value',value).trigger('setFormData',value);
        }else if($target.is('input:checkbox')){
            if(!Array.isArray(value)){
                value=[value];
            }
            this.$el.find(_.map(value,(itemValue)=>`.${this.options.fieldClass}[name="${name}"][value="${itemValue}"]`).join(',')).prop('checked',true);
        }else if($target.is('input:radio')){
            this.$el.find(`.${this.options.fieldClass}[name="${name}"][value="${value}"]:eq(0)`).prop('checked',true);
        }else if($target.is('select')){
            $target.children(`option[value="${value}"]`).prop('selected',true);
        }else{
            $target.val(value);
        }
        return this;
    }
    _getTargetValue(target){
        var $target=$(target),name=$target.attr('name');
        if($target.is('[data-value]')||$target.data('value')!==undefined||$target.is('div')){
            return $target.data('value');
        }else if($target.is('input:checkbox')){
            return _.map(this.$el.find(`.${this.options.fieldClass}[name="${name}"]:checked`),(item)=>$(item).attr('value'));
        }else if($target.is('input:radio')){
            return this.$el.find(`.${this.options.fieldClass}[name="${name}"]:checked`).attr('value');
        }
        return $target.val();
    }
    _bindEvent(){
        var _this=this;
        var triggerValidate=function(){
            _this.validate(this).then(function(result){
                _this._setError(result);
            });
        };
        this.$el.on('blur dataChange',`.${this.options.fieldClass}`,triggerValidate)
            .on('input',`.${this.options.fieldClass}`,_.debounce(function(){
                    var res=_this.validate(this);
                    if(_this.options.realTimeError){
                res.then(function(result){
                    _this._setError(result);
                });
            }
                },this.options.delayTime))
            .on('change',`.${this.options.fieldClass}[type="checkbox"],.${this.options.fieldClass}[type="radio"],.${this.options.fieldClass}[type="select"]`,triggerValidate)
            .on('focus',`.${this.options.fieldClass}`,function(){
                _this._setError({
                    status:true,
                    name:$(this).attr('name')
                });
            });
    }
}

/**
 * 注册jquery插件
 * */
$.fn.form=function(options){
    if($(this).length==0){
        return new Error('选择器所选元素不能为空');
    }
    if($(this).length>1){
        console.warn('选择器选中多个元素，默认只有第一个生效。请自行遍历jquery对象中的元素。');
    }
    return new JForm($(this)[0],options);
}

export default JForm;