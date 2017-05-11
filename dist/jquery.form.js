(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash'), require('jquery')) :
	typeof define === 'function' && define.amd ? define(['lodash', 'jquery'], factory) :
	(global.Form = factory(global._,global.$));
}(this, (function (_,$) { 'use strict';

_ = 'default' in _ ? _['default'] : _;
$ = 'default' in $ ? $['default'] : $;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var RULES = {
    tel: {
        regExp: /^1[0-9]{10}$/,
        des: '请输入有效的手机号'
    },
    email: {
        regExp: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        des: '请输入有效的邮箱'
    },
    pwd: {
        regExp: /^[a-zA-Z0-9]{6,20}$/,
        des: '请输入6-20位数字/字母'
    }
};
var EVENT_ALL = 'all_event_263';

/**
 * 表单验证的主要逻辑
 * */

var Form = function () {
    /**
     * 创建一个表单管理<br>
     *
     * 注意：lengthErrorTempFunc为一个方法，返回一个错误信息模版
     * <br>自定义验证规则rules里面func和regExp同时存在时执行func，忽略regExp
     * <br>自定义验证规则rules里面func返回一个boolean的结果
     * @param {object} options 表单验证配置信息
     * @param {string} options.reqErrorTemp 空错误错误信息模版
     * @param {function} options.lengthErrorTempFunc 长度校验错误信息模版方法
     * @param {number} options.lengthErrorTempFunc.start 最小长度
     * @param {number} options.lengthErrorTempFunc.end 最大长度
     * @param {number} options.lengthErrorTempFunc.type 模版类型
     * @param {object} options.rules 自定义规则
     * @param {object} options.rules.key 规则名称
     * @param {RegExp} options.rules.regExp 验证规则，正则表达式
     * @param {string} options.rules.des 描述，当验证不通过时的错误信息模版
     * @param {function} options.rules.func 验证规则，执行后返回验证结果
     * */
    function Form(options) {
        classCallCheck(this, Form);

        /**
         * 将options里的配置参数和默认的配置参数merge后的最终参数
         * */
        this.options = this._merge({}, {
            reqErrorTemp: '%s不能为空',
            lengthErrorTempFunc: function lengthErrorTempFunc(start, end, type) {
                //type==1:必须等于 //type==2:必须大于 //type==3:必须小于
                var msg = {
                    1: '%s\u5FC5\u987B\u4E3A' + start + '\u4E2A\u5B57\u7B26',
                    2: '%s\u5FC5\u987B\u5927\u4E8E' + start + '\u4E2A\u5B57\u7B26',
                    3: '%s\u5FC5\u987B\u5C0F\u4E8E' + end + '\u4E2A\u5B57\u7B26'
                };
                return msg[type];
            },
            rules: RULES
        }, options);

        /**
         * 用来储存校验字段的当前校验状态，以便下次同一校验字段进行校验时直接从cache中取得校验结果
         * @private
         * */
        this._cache = {};
        /**
         * 用来存储验证结果
         * 1为已通过 2为正在校验 3为校验失败
         * @private
         * */
        this._result = {};
        /**
         * 用来缓存校验规则的解析结果
         * @private
         * */
        this._ruleCache = {};
        /**
         * 用来储存使用者对表单校验状态改变事件的监听的回调函数
         * @deprecated
         * event type说明:
         *
         * 1.all所有类型都执行回调函数
         * 2.error校验中出现校验不通过情况，触发该事件，返回错误提示字符串，终止该字段的剩余校验过程
         * 3.loading校验字段中存在用户自定义校验，并且调用用户自定义校验函数返回promise对象，触发该事件
         * 4.pass执行校验的字段完成了所有的校验，并且全部通过校验
         * @private
         * */
        this._events = {};
        /**
         * middlewares用来储存使用者追加自定义表单校验规则的回调函数
         * @private
         * */
        this._middlewares = {};
    }
    /**
     * 对字段进行校验
     * @param {string} name 字段名
     * @param {all} value 被校验字段的值
     * @param {string} ruleStr 校验规则表达式
     * @return {Promise} promise对象,验证结果如：promise.then((result)=>{})
     * */


    Form.prototype.getValidateResult = function getValidateResult(name, value, ruleStr) {
        var _this = this;

        var rule = this._getRule(ruleStr);
        var cache = this._getCache(name, value, ruleStr);
        if (cache.status !== undefined) {
            return Promise.resolve(cache);
        }
        var returnResult = function returnResult(result) {
            if (result.loading === true) {
                if (result.status === true) {
                    _this._triggerEvent('loaded', name, value);
                } else {
                    _this._result[name] = 2;
                    _this._triggerEvent('loading', name, value);
                }
            } else {
                var _cache = { status: result.status, name: name, value: value, rule: ruleStr };
                if (_cache.status === false && result.msg) {
                    _cache.msg = result.msg;
                }
                _this._setCache(_cache);
                if (result.status === true) {
                    _this._result[name] = 1;
                    _this._triggerEvent('pass', name, value);
                } else {
                    _this._result[name] = 3;
                    _this._triggerEvent('error', name, value);
                }
                return Promise.resolve(_cache);
            }
        };
        //空性判断
        if (this.isEmpty(value)) {
            if (rule.req) {
                return returnResult({ status: false, msg: this.options.reqErrorTemp });
            } else {
                return returnResult(cache.result = { status: true });
            }
        }
        //长度判断
        if (value.length != undefined && rule.length && rule.length.start) {
            if (rule.length.start === rule.length.end && value.length !== rule.length.start) {
                return returnResult({ status: false, msg: this.options.lengthErrorTempFunc(rule.length.start, rule.length.end, 1) });
            }
            if (value.length < rule.length.start) {
                return returnResult({ status: false, msg: this.options.lengthErrorTempFunc(rule.length.start, rule.length.end, 2) });
            }
            if (rule.length.end && value.length > rule.length.end) {
                return returnResult({ status: false, msg: this.options.lengthErrorTempFunc(rule.length.start, rule.length.end, 3) });
            }
        }
        //类型判断
        if (rule.type && rule.type.length > 0) {
            for (var _iterator = rule.type, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                var key = _ref;

                var ruleType = this.options.rules[key];
                if (ruleType && ruleType.func && typeof ruleType.func == 'function' && !ruleType.func(value)) {
                    return returnResult({ status: false, msg: ruleType.des });
                } else if (ruleType && ruleType.regExp && ruleType.regExp instanceof RegExp && !ruleType.regExp.test(value)) {
                    return returnResult({ status: false, msg: ruleType.des });
                }
            }
        }
        //用户自定义规则判断
        var extraList = this._middlewares[name];
        if (extraList && extraList.length > 0) {
            returnResult({ status: false, loading: true });
            return Promise.all(extraList.map(function (extra) {
                if (typeof extra == 'function') {
                    return new Promise(function (reslove, reject) {
                        extra(value, function (result) {
                            if (result === true || result.status === true) {
                                reslove(result);
                            } else {
                                reject(result);
                            }
                        });
                    });
                }
            })).then(function () {
                return returnResult({ status: true });
            }, function (result) {
                return returnResult(result);
            }).then(function (result) {
                returnResult({ status: true, loading: true });
                return result;
            });
        } else {
            return returnResult({ status: true });
        }
    };
    /**
     * 对一组值调用getValidateResult进行校验
     * @param {Array} dataArray 一组被校验值，格式如getValidateResult
     * @return {Array} promise对象数组
     * */


    Form.prototype.getFormValidateResult = function getFormValidateResult(dataArray) {
        var _this2 = this;

        return Promise.all(dataArray.map(function (field) {
            return _this2.getValidateResult(field.name, field.value, field.rule);
        }));
    };
    /**
     * 判断当前表单中是否存在验证不通过字段，如果传入参数值name，则判断当前字段验证是否不通过
     * @param {string} name 字段名
     * @return {bool} 字段是否验证不通过
     * */


    Form.prototype.isError = function isError(name) {
        if (name) {
            return this._result[name] === 3;
        }
        return this._some(this._result, function (result) {
            return result === 3;
        });
    };
    /**
     * 判断当前表单中是否存在正在进行远程校验，如果传入参数值name，则判断当前字段验证是否正在进行远程校验
     * @param {string} name 字段名
     * @return {bool} 字段是否正在进行远程校验
     * */


    Form.prototype.isLoading = function isLoading(name) {
        if (name) {
            return this._result[name] === 2;
        }
        return this._some(this._result, function (result) {
            return result === 2;
        });
    };
    /**
     * 判断当前表单中的全部字段是否全都验证通过，如果传入参数值name，则判断当前字段验证是否验证通过
     * @param {string} name 字段名
     * @return {bool} 字段是否验证通过
     * */


    Form.prototype.isPass = function isPass(name) {
        if (name) {
            return this._result[name] === 1;
        }
        return this._every(this._result, function (result) {
            return result === 1;
        });
    };
    /**
     * 判断当前值是不是满足表单空值判断
     * @param {Anything} value  输入值
     * @return {bool} 是否为空
     * */


    Form.prototype.isEmpty = function isEmpty(value) {
        return value === undefined || value === null || value === '' || value.length == 0 || this._isEmptyObject(value);
    };
    /**
     * 清除当前字段有关的验证缓存
     * @param {string} name 字段名
     * @return {Form} Form对象本身
     * */


    Form.prototype.clearFieldCache = function clearFieldCache(name) {
        if (this._cache[name]) {
            delete this._cache[name];
        }
        return this;
    };
    /**
     * 清除所有字段有关的验证缓存
     * @return {Form} Form对象本身
     * */


    Form.prototype.clearAllCache = function clearAllCache() {
        this._cache = {};
        return this;
    };
    /**
     * 添加事件绑定
     * @param {string} eventName 事件名称 pass：字段验证通过事件 loading：字段开始进行远程校验 error：字段校验不通过
     * @param {string} name 字段名称（可选）
     * @param {function} callback 事件触发后回调
     * @return {Form} Form对象本身
     * */


    Form.prototype.on = function on(eventName) {
        var _ref2,
            _this3 = this;

        var name = arguments.length <= 1 ? undefined : arguments[1],
            callback = (_ref2 = (arguments.length <= 1 ? 0 : arguments.length - 1) - 1 + 1, arguments.length <= _ref2 ? undefined : arguments[_ref2]);
        if (typeof name !== 'string') {
            name = EVENT_ALL;
        }
        if (typeof callback !== 'function') {
            return;
        }
        eventName.split(' ').forEach(function (eventName) {
            if (!_this3._events[eventName]) {
                _this3._events[eventName] = {};
            }
            name.split(' ').forEach(function (name) {
                if (!_this3._events[eventName][name]) {
                    _this3._events[eventName][name] = [];
                }
                _this3._events[eventName][name].push(callback);
            });
        });
        return this;
    };
    /**
     * 取消事件绑定
     * @param {string} eventName 事件名称 pass：字段验证通过事件 loading：字段开始进行远程校验 error：字段校验不通过
     * @param {string} name 字段名称（可选）
     * @return {Form} Form对象本身
     * */


    Form.prototype.off = function off(eventName, name) {
        if (name) {
            if (this._events[eventName][name]) {
                this._events[eventName][name] = [];
            }
        } else {
            this._events[eventName] = {};
        }
        return this;
    };
    /**
     * 追加字段的远程校验
     * @param {string} name 字段名称，
     * @param {function} callback 回调函数接受字段的值，返回一个验证结果对象或true
     * @return {Form} Form对象本身
     * */


    Form.prototype.use = function use(name, callback) {
        if (typeof name !== 'string' || typeof callback !== 'function') {
            return;
        }

        if (!this._middlewares[name]) {
            this._middlewares[name] = [];
        }
        this._middlewares[name].push(callback);
        return this;
    };

    Form.prototype._getCache = function _getCache(name, value, rule) {
        var hashCode = this._getCacheCode(name, value, rule);
        if (this._cache[hashCode]) {
            return this._cache[hashCode];
        } else {
            return {};
        }
    };

    Form.prototype._setCache = function _setCache(result) {
        var hashCode = this._getCacheCode(result.name, result.value, result.rule);
        delete result['rule'];
        this._cache[hashCode] = result;
    };

    Form.prototype._getCacheCode = function _getCacheCode(name, value) {
        var rule = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
            value = JSON.stringify(value).replace(/[\{\}\[\]\"\:\,]/g, '');
        } else {
            value += '';
        }
        rule = rule.replace(/[\-\s]/g, '');

        return this._jsHashCode(rule + name + value);
    };

    Form.prototype._jsHashCode = function _jsHashCode(key) {
        var hash = 1315423911;
        for (var i = 0; i < key.length; i++) {
            hash ^= (hash << 5) + key.charCodeAt(i) + (hash >> 2);
        }
        return hash & 0x7FFFFFFF;
    };

    Form.prototype._getRule = function _getRule() {
        var _this4 = this;

        var rule = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        if (this._ruleCache[rule]) {
            return this._ruleCache[rule];
        }
        var _rule = {};
        rule.split(' ').forEach(function (n) {
            if (/^required|req$/i.test(n)) {
                _rule.req = true;
            } else if (/^[0-9]+(-[0-9]+)?$/.test(n)) {
                if (_rule.length === undefined) {
                    var _n$split = n.split('-'),
                        start = _n$split[0],
                        end = _n$split[1];

                    var length = { start: parseInt(start) };
                    if (end) {
                        end = parseInt(end);
                        if (start <= end) {
                            length.end = end;
                            _rule.length = length;
                        }
                    } else {
                        _rule.length = length;
                    }
                }
            } else if (_this4.options.rules[n]) {
                if (!_rule.type) {
                    _rule.type = [];
                }
                _rule.type.push(n);
            }
        });
        return this._ruleCache[rule] = _rule;
    };

    Form.prototype._triggerEvent = function _triggerEvent(eventType, name, value) {
        if (this._events[eventType]) {
            if (this._events[eventType][name]) {
                this._events[eventType][name].forEach(function (func) {
                    return func(value, eventType, name);
                });
            }
            if (this._events[eventType][EVENT_ALL]) {
                this._events[eventType][EVENT_ALL].forEach(function (func) {
                    return func(value, eventType, name);
                });
            }
        }
    };

    Form.prototype._isEmptyObject = function _isEmptyObject(value) {
        return _.isObject(value) && _.isEmpty(value);
    };

    Form.prototype._some = function _some(array, callback) {
        return _.some(array, callback);
    };

    Form.prototype._every = function _every(array, callback) {
        return _.every(array, callback);
    };

    Form.prototype._merge = function _merge() {
        return _.merge.apply(_, arguments);
    };

    return Form;
}();

/**
 * 用于jquery的UI逻辑封装
 * */

var JForm = function () {
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
    function JForm($el, options) {
        classCallCheck(this, JForm);

        this.$el = $($el);
        this.options = _.merge({}, {
            fieldClass: 'J_form-field',
            containerClass: 'J_form-container',
            msgClass: 'J_form-msg',
            msgErrorClass: 'is-error',
            errorClass: 'form-error',
            nullError: false,
            callback: null,
            delayTime: 500,
            realTimeError: true
        }, options);
        this._form = new Form({
            rules: this.options.rules,
            reqErrorTemp: this.options.reqErrorTemp,
            lengthErrorTempFunc: this.options.lengthErrorTempFunc
        });
        this._bindEvent();
    }
    /**
     * 提交表单，如果有没有验证的字段则进行校验，所有字段均被校验并且全部都验证通过后执行options.callback，如果callback参数存在则执行callback，不执行options.callback
     * @param {function} callback 所有字段验证通过后调用该方法，如果该方法返回值为false，则放弃执行options.callback方法
     * @return {Promise} Promise对象，在then中可以传入验证全部结束回调
     * */


    JForm.prototype.submit = function submit(callback) {
        var _this2 = this;

        return Promise.all([].map.call(this.$el.find('.' + this.options.fieldClass), function (target) {
            return _this2.validate(target);
        })).then(function (results) {
            var allPass = true,
                data = {};
            results.forEach(function (result) {
                _this2._setError(result, true);
                if (result.status === true) {
                    data[result.name] = result.value;
                } else {
                    allPass = false;
                }
            });
            if (allPass) {
                if (!(callback && callback(data) === false)) {
                    _this2.options.callback && _this2.options.callback(data);
                }
            }
            return { pass: allPass, data: data };
        });
    };
    /**
     * 向某个字段错误状态和信息
     * @param {name} 字段名
     * @param {msg} 错误信息
     * @return {JForm} JForm对象
     * */


    JForm.prototype.setError = function setError(name, msg) {
        this._setError({ status: false, name: name, msg: msg, value: this.getFieldValue(name) });
        return this;
    };
    /**
     * 同Form.prototype.use
     * @return {JForm} JForm对象
     * */


    JForm.prototype.use = function use() {
        var _form;

        (_form = this._form).use.apply(_form, arguments);
        return this;
    };
    /**
     * 同Form.prototype.on
     * @return {JForm} JForm对象
     * */


    JForm.prototype.on = function on() {
        var _form2;

        (_form2 = this._form).on.apply(_form2, arguments);
        return this;
    };
    /**
     * 同Form.prototype.isLoading
     * */


    JForm.prototype.isLoading = function isLoading(name) {
        return this._form.isLoading(name);
    };
    /**
     * 同Form.prototype.isError
     * */


    JForm.prototype.isError = function isError(name) {
        return this._form.isError(name);
    };
    /**
     * 同Form.prototype.isPass
     * */


    JForm.prototype.isPass = function isPass(name) {
        return this._form.isPass(name);
    };
    /**
     * 对一个字段进行验证
     * @param {Element} target 字段元素
     * @return {Object} 验证结果对象
     * */


    JForm.prototype.validate = function validate(target) {
        var $target = $(target);
        var name = $target.attr('name'),
            value = this._getTargetValue(target),
            rule = $target.attr('rule');
        return this._form.getValidateResult(name, value, rule);
    };
    /**
     * 获取某个字段当前的值
     * @param {string} name 字段名
     * @reutrn {Anything} 字段当前值
     * */


    JForm.prototype.getFieldValue = function getFieldValue(name) {
        return this._getTargetValue(this.$el.find('.' + this.options.fieldClass + '[name="' + name + '"]'));
    };
    /**
     * 给表单中的某个字段赋值
     * @param {string} name 字段名
     * @param {Anything} value  字段的值
     * @return {JForm} JForm对象
     * */


    JForm.prototype.setFieldValue = function setFieldValue(name, value) {
        this._setTargetValue(this.$el.find('.' + this.options.fieldClass + '[name="' + name + '"]'), value);
        return this;
    };
    /**
     * 给整个表单赋值
     * @param {Object} data 表单值
     * @return {JForm} JForm对象
     * */


    JForm.prototype.setFormData = function setFormData(data) {
        var _this3 = this;

        _.each(data, function (value, name) {
            return _this3.setFieldValue(name, value);
        });
        return this;
    };
    /**
     * 清除表单校验缓存
     * @param {string} name 表单值（可选）当没有传入name时，清除整个表单缓存，当传入name时只清除该字段的缓存
     * @return {JForm} JForm对象
     * */


    JForm.prototype.clear = function clear(name) {
        if (name) {
            this._form.clearFieldCache(name);
        } else {
            this._form.clearAllCache();
        }
    };

    JForm.prototype._setError = function _setError(result, fromSubmit) {
        var $outer = this.$el.find('.' + this.options.containerClass + '_' + result.name),
            $msg = this.$el.find('.' + this.options.msgClass + '_' + result.name),
            $field = this.$el.find('.' + this.options.fieldClass + '[name="' + result.name + '"]'),
            label = $field.attr('label');
        if ($outer.length == 0) {
            $outer = $field;
        }
        if (result.status === true || !fromSubmit && !this.options.nullError && this._form.isEmpty(result.value)) {
            $outer.removeClass(this.options.errorClass);
            $msg.removeClass(this.options.msgErrorClass).html('');
        } else {
            $outer.addClass(this.options.errorClass);
            $msg.addClass(this.options.msgErrorClass).html(result.msg.replace('%s', label || '该字段'));
        }
        return this;
    };

    JForm.prototype._setTargetValue = function _setTargetValue(target, value) {
        var _this4 = this;

        var $target = $(target),
            name = $target.attr('name');
        if ($target.is('[data-value]') || $target.data('value') !== undefined || $target.is('div')) {
            $target.data('value', value).trigger('setFormData', value);
        } else if ($target.is('input:checkbox')) {
            if (!Array.isArray(value)) {
                value = [value];
            }
            this.$el.find(_.map(value, function (itemValue) {
                return '.' + _this4.options.fieldClass + '[name="' + name + '"][value="' + itemValue + '"]';
            }).join(',')).prop('checked', true);
        } else if ($target.is('input:radio')) {
            this.$el.find('.' + this.options.fieldClass + '[name="' + name + '"][value="' + value + '"]:eq(0)').prop('checked', true);
        } else if ($target.is('select')) {
            $target.children('option[value="' + value + '"]').prop('selected', true);
        } else {
            $target.val(value);
        }
        return this;
    };

    JForm.prototype._getTargetValue = function _getTargetValue(target) {
        var $target = $(target),
            name = $target.attr('name');
        if ($target.is('[data-value]') || $target.data('value') !== undefined || $target.is('div')) {
            return $target.data('value');
        } else if ($target.is('input:checkbox')) {
            return _.map(this.$el.find('.' + this.options.fieldClass + '[name="' + name + '"]:checked'), function (item) {
                return $(item).attr('value');
            });
        } else if ($target.is('input:radio')) {
            return this.$el.find('.' + this.options.fieldClass + '[name="' + name + '"]:checked').attr('value');
        }
        return $target.val();
    };

    JForm.prototype._bindEvent = function _bindEvent() {
        var _this = this;
        var triggerValidate = function triggerValidate() {
            _this.validate(this).then(function (result) {
                _this._setError(result);
            });
        };
        this.$el.on('blur dataChange', '.' + this.options.fieldClass, triggerValidate).on('input', '.' + this.options.fieldClass, _.debounce(function () {
            var res = _this.validate(this);
            if (_this.options.realTimeError) {
                res.then(function (result) {
                    _this._setError(result);
                });
            }
        }, this.options.delayTime)).on('change', '.' + this.options.fieldClass + '[type="checkbox"],.' + this.options.fieldClass + '[type="radio"],.' + this.options.fieldClass + '[type="select"]', triggerValidate).on('focus', '.' + this.options.fieldClass, function () {
            _this._setError({
                status: true,
                name: $(this).attr('name')
            });
        });
    };

    return JForm;
}();

/**
 * 注册jquery插件
 * */


$.fn.form = function (options) {
    if ($(this).length == 0) {
        return new Error('选择器所选元素不能为空');
    }
    if ($(this).length > 1) {
        console.warn('选择器选中多个元素，默认只有第一个生效。请自行遍历jquery对象中的元素。');
    }
    return new JForm($(this)[0], options);
};

return JForm;

})));
//# sourceMappingURL=jquery.form.js.map
