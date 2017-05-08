(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash')) :
	typeof define === 'function' && define.amd ? define(['lodash'], factory) :
	(global.Form = factory(global._));
}(this, (function (_) { 'use strict';

_ = 'default' in _ ? _['default'] : _;

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
var EVENT_ALL = 263;

var _class = function () {
    function _class(options) {
        classCallCheck(this, _class);

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
         * cache用来储存校验字段的当前校验状态，以便下次同一校验字段进行校验时直接从cache中取得校验结果
         * */
        this._cache = {};
        this._ruleCache = {};
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
        this._events = {};
        /**
         * middlewares用来储存使用者追加自定义表单校验规则的回调函数
         * */
        this._middlewares = {};
    }

    _class.prototype.getValidateResult = function getValidateResult(name, value, ruleStr) {
        var _this = this;

        var rule = this._getRule(ruleStr);
        var cache = this._getCache(name, value, ruleStr);
        if (cache.status !== undefined) {
            return Promise.resolve(cache);
        }
        var returnResult = function returnResult(result) {
            result.name = name;
            result.value = value;
            result.rule = ruleStr;
            _this._setCache(result);
            if (result.status === true) {
                _this._triggerEvent('pass', name, value);
            } else if (result.status === false && result.loading === true) {
                _this._triggerEvent('loading', name, value);
            } else {
                _this._triggerEvent('error', name, value);
            }
            return Promise.resolve(result);
        };
        //空性判断
        if (this._isEmpty(value)) {
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
            });
        } else {
            return returnResult({ status: true });
        }
    };

    _class.prototype.getFormValidateResult = function getFormValidateResult(dataArray) {
        var _this2 = this;

        return Promise.all(dataArray.map(function (field) {
            return _this2.getValidateResult(field.name, field.value, field.rule);
        }));
    };

    _class.prototype.isError = function isError(name) {
        if (name) {
            return this._cache[name].status === false && this._cache[name].loading !== true;
        }
        return this._find(this._cache, function (result) {
            return result.status === false && result.loading !== true;
        });
    };

    _class.prototype.isLoading = function isLoading(name) {
        if (name) {
            return this._cache[name].status === false && this._cache[name].loading === true;
        }
        return this._find(this._cache, function (result) {
            return result.status === false && result.loading === true;
        });
    };

    _class.prototype.isPass = function isPass(name) {
        if (name) {
            return this._cache[name].status === true;
        }
        return this._every(this._cache, function (result) {
            return result.status === true;
        });
    };

    _class.prototype.clearFieldCache = function clearFieldCache(name) {
        if (this._cache[name]) {
            delete this._cache[name];
        }
        return this;
    };

    _class.prototype.clearAllCache = function clearAllCache() {
        this._cache = {};
        return this;
    };

    _class.prototype.on = function on(eventName) {
        var _ref2;

        var name = arguments.length <= 1 ? undefined : arguments[1],
            callback = (_ref2 = (arguments.length <= 1 ? 0 : arguments.length - 1) - 1 + 1, arguments.length <= _ref2 ? undefined : arguments[_ref2]);
        if (typeof name !== 'string') {
            name = EVENT_ALL;
        }
        if (typeof callback !== 'function') {
            return;
        }
        if (!this._events[eventName]) {
            this._events[eventName] = {};
        }
        if (!this._events[eventName][name]) {
            this._events[eventName][name] = [];
        }
        this._events[eventName][name].push(callback);
        return this;
    };

    _class.prototype.off = function off(eventName, name) {
        if (name) {
            if (this._events[eventName][name]) {
                this._events[eventName][name] = [];
            }
        } else {
            this._events[eventName] = {};
        }
        return this;
    };

    _class.prototype.use = function use(name, callback) {
        if (typeof name !== 'string' || typeof callback !== 'function') {
            return;
        }

        if (!this._middlewares[name]) {
            this._middlewares[name] = [];
        }
        this._middlewares[name].push(callback);
        return this;
    };

    _class.prototype._getCache = function _getCache(name, value, rule) {
        var hashCode = this._getCacheCode(name, value, rule);
        if (this._cache[hashCode] && this._cache[hashCode].loading !== true) {
            return this._cache[hashCode];
        } else {
            return {};
        }
    };

    _class.prototype._setCache = function _setCache(result) {
        var hashCode = this._getCacheCode(result.name, result.value, result.rule);
        delete result['rule'];
        this._cache[hashCode] = result;
    };

    _class.prototype._getCacheCode = function _getCacheCode(name, value) {
        var rule = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
            value = JSON.stringify(value).replace(/[\{\}\[\]\"\:\,]/g, '');
        } else {
            value += '';
        }
        rule = rule.replace(/[\-\s]/g, '');

        return this._jsHashCode(rule + name + value);
    };

    _class.prototype._jsHashCode = function _jsHashCode(key) {
        var hash = 1315423911;
        for (var i = 0; i < key.length; i++) {
            hash ^= (hash << 5) + key.charCodeAt(i) + (hash >> 2);
        }
        return hash & 0x7FFFFFFF;
    };

    _class.prototype._getRule = function _getRule() {
        var _this3 = this;

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
            } else if (_this3.options.rules[n]) {
                if (!_rule.type) {
                    _rule.type = [];
                }
                _rule.type.push(n);
            }
        });
        return this._ruleCache[rule] = _rule;
    };

    _class.prototype._isEmpty = function _isEmpty(value) {
        return value === undefined || value === null || value === '' || value.length == 0 || this._isEmptyObject(value);
    };

    _class.prototype._isEmptyObject = function _isEmptyObject(value) {
        return _.isObject(value) && _.isEmpty(value);
    };

    _class.prototype._triggerEvent = function _triggerEvent(eventType, name, value) {
        if (this._events[eventType]) {
            if (this._events[eventType][name]) {
                this._events[eventType][name](value, eventType, name);
                this._events[eventType][EVENT_ALL](value, eventType, name);
            }
        }
    };

    _class.prototype._find = function _find(array, callback) {
        return _.find(array, callback);
    };

    _class.prototype._every = function _every(array, callback) {
        return _.every(array, callback);
    };

    _class.prototype._merge = function _merge() {
        return _.merge.apply(_, arguments);
    };

    return _class;
}();

return _class;

})));
//# sourceMappingURL=form.js.map
