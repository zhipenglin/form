import Form from './form'
import _ from 'lodash'
import $ from 'jquery'

class JForm {
    constructor($el,options){
        this.$el=$($el);
        this.options=_.merge({},{
            fieldClass:'J_form-field',
            containerClass:'J_form-container',
            msgClass:'J_form-msg',
            errorClass:'form-error',
            nullError:false,
            callback:null
        },options);
        this._form=new Form({
            rules:this.options.rules,
            reqErrorTemp:this.options.reqErrorTemp,
            lengthErrorTempFunc:this.options.lengthErrorTempFunc
        });
        this._bindEvent();
    }
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
    }
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
    }
    use(...args){
        this._form.use(...args);
        return this;
    }
    on(...args){
        this._form.on(...args);
        return this;
    }
    isLoading(name){
        return this._form.isLoading(name);
    }
    isError(name){
        return this._form.isError(name);
    }
    isPass(name){
        return this._form.isPass(name);
    }
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
        }).on('input',`.${this.options.fieldClass}`,function(){
            _this.validate(this);
        });
    }
}

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