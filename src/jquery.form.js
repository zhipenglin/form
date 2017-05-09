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
     * */
    constructor($el,options){
        this.$el=$($el);
        this.options=_.merge({},{
            fieldClass:'J_form-field',
            containerClass:'J_form-container',
            msgClass:'J_form-msg',
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
     * @param {function} callback 所有字段验证通过后调用该方法
     * @return {JForm} JForm对象
     * */
    submit(callback){
        Promise.all([].map.call(this.$el.find(`.${this.options.fieldClass}`),(target)=>{
            return this.validate(target);
        })).then((results)=>{
            var allPass=true,data={};
            results.forEach((result)=>{
                this.setError(result);
                if(result.status===true){
                    data[result.name]=result.value;
                }else{
                    allPass=false;
                }
            });
            if(allPass){
                if(callback){
                    callback(data);
                }else{
                    this.options.callback&&this.options.callback(data);
                }
            }
        });
        return this;
    }
    /**
     * 根据验证结果，向某个字段写入显示状态
     * @param {Object} result 验证结果对象
     * @return {JForm} JForm对象
     * */
    setError(result){
        var $outer=this.$el.find(`.${this.options.containerClass}_${result.name}`),
            $msg=this.$el.find(`.${this.options.msgClass}_${result.name}`),
            $field=this.$el.find(`.${this.options.fieldClass}[name="${result.name}"]`),
            label=$field.attr('label');
        if($outer.length==0){
            $outer=$field;
        }
        if(result.status===true||(!this.options.nullError&&this._form._isEmpty(result.value))){
            $outer.removeClass(this.options.errorClass);
            $msg.html('');
        }else{
            $outer.addClass(this.options.errorClass);
            $msg.html(result.msg.replace('%s',label||'该字段'));
        }
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
    _setTargetValue(target,value){
        var $target=target;
        $target.val(value);
    }
    _getTargetValue(target){
        var $target=$(target);
        return $target.val();
    }
    _bindEvent(){
        var _this=this;
        this.$el.on('blur dataChange',`.${this.options.fieldClass}`,function(){
            _this.validate(this).then(function(result){
                _this.setError(result);
            });
        }).on('input',`.${this.options.fieldClass}`,_.debounce(function(){
            var res=_this.validate(this);
            if(_this.options.realTimeError){
                res.then(function(result){
                    _this.setError(result);
                });
            }
        },this.options.delayTime)).on('focus',`.${this.options.fieldClass}`,function(){
            _this.setError({
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