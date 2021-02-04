(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  // 不能直接改写数组原方法，也就是不能直接 Array.prototype.push = fn 直接改写，这样数组原功能也会被覆盖掉
  // 需要通过 Object.create(Array.prototype) 来创建一个对象，通过原型链来获取到数组的方法
  var oldArrayMethods = Array.prototype;
  var arrayMethods = Object.create(Array.prototype); // 7个会改变原数组的方法，而其他诸如concat slice等都不会改变原数组

  var methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort']; // AOP切片编程

  methods.forEach(function (method) {
    arrayMethods[method] = function () {
      var _oldArrayMethods$meth;

      // 有可能用户新增的数据是对象，也需要进行拦截，比如 vm._data.arr.push({a: 1})
      var inserted;
      var ob = this.__ob__;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          // splice(0, 1, xxx)
          inserted = args.slice(2);
      } // 如果有值则需要使用 observeArray 方法，通过 Observer 中对每一项进行监控时，如果为数组则会在该数组属性上挂上数组遍历方法


      if (inserted) {
        ob.observeArray(inserted);
      } // 调用数组原有方法执行


      var result = (_oldArrayMethods$meth = oldArrayMethods[method]).call.apply(_oldArrayMethods$meth, [this].concat(args));

      return result;
    };
  });

  var Observer = /*#__PURE__*/function () {
    function Observer(value) {
      _classCallCheck(this, Observer);

      // value 最初为 data 传入的每一项数据
      // 这一句是为了在 arrayMethods中可以使用 observeArray 方法，如果是数组，则会在数组上挂载一个 Observer 实例
      // 在数组arrayMethods拦截中可以使用 observeArray 来对数组进行观测
      Object.defineProperty(value, '__ob__', {
        value: this,
        enumerable: false,
        // 不能被枚举，否则会导致死循环
        configurable: false // 不能删除此属性

      }); // value可能是对象 也可能是数组，需要分开处理

      if (Array.isArray(value)) {
        // value.__ob__ = this
        // 数组不用defineProperty来进行代理 性能不好
        // 如果是数组，则将数组原型链指向被劫持后的数组，这样如果是改变数组的方法则会先被劫持，否则通过原型链使用数组方法
        Object.setPrototypeOf(value, arrayMethods);
        this.observeArray(value); // 原有数组中的对象
        // value.__proto__ = arrayMethods // 同上，但这种写法非标准。个人文章：https://www.jianshu.com/p/28a0164b0d63
      } else {
        this.walk(value);
      }
    } // 监控数组中是否为对象，如果是则进行劫持


    _createClass(Observer, [{
      key: "observeArray",
      value: function observeArray(value) {
        for (var i = 0; i < value.length; i++) {
          observe(value[i]);
        }
      }
    }, {
      key: "walk",
      value: function walk(data) {
        // 将对象中所有的key 重新用 defineProperty定义成响应式的
        Object.keys(data).forEach(function (key) {
          defineReactive(data, key, data[key]);
        });
      }
    }]);

    return Observer;
  }();

  function defineReactive(data, key, value) {
    // vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象
    observe(value); // 对结果递归拦截

    Object.defineProperty(data, key, {
      get: function get() {
        return value;
      },
      set: function set(newValue) {
        // 值没变化，无需重新设置
        if (newValue === value) return;
        observe(newValue); // 如果用户设置的是一个对象，就继续将用户设置的对象变成响应式的

        value = newValue;
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== 'object' || data == null) return;
    if (data.__ob__) return; // 如果有__ob__，证明已经被观测了
    // 通过类来实现对数据的观测，类可以方便拓展，会产生实例

    return new Observer(data);
  }

  function initState(vm) {
    // 将所有数据都定义在 vm 属性上，并且后续更改需要触发视图更新
    var opts = vm.$options; // 获取用户属性
    // 加入options中有同名，查看属性的顺序：props -> methods -> data -> computed -> watch
    // 如果有data属性，初始化数据

    if (opts.data) {
      initData(vm);
    }

    if (opts.methods) ;
  } // 数据代理

  function Proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get: function get() {
        return vm[source][key];
      },
      set: function set(newValue) {
        vm[source][key] = newValue;
      }
    });
  } // 初始化数据


  function initData(vm) {
    // 数据劫持 Object.defineProperty
    var data = vm.$options.data; // data 有可能是个对象，也可能是个函数，如果是个函数，获取函数返回值作为对象

    data = vm._data = typeof data === 'function' ? data.call(vm) : data; // 这里最开头的data暂时没看出来有什么用
    // 通过 vm._data 获取劫持后的数据，用户就可以拿到 _data 了
    // 将 _data 中的数据全部放到 vm 上

    for (var key in data) {
      Proxy(vm, '_data', key);
    } // 观测数据


    observe(data);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this; // 实例上有个属性 $options ，表示的是用户传入的所有属性

      vm.$options = options; // 初始化状态

      initState(vm);
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
