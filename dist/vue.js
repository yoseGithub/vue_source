(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('_rollup@2.38.4@rollup')) :
  typeof define === 'function' && define.amd ? define(['_rollup@2.38.4@rollup'], factory) :
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

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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


      if (inserted) ob.observeArray(inserted);
      ob.dep.notify(); // 调用数组原有方法执行

      var result = (_oldArrayMethods$meth = oldArrayMethods[method]).call.apply(_oldArrayMethods$meth, [this].concat(args));

      return result;
    };
  });

  // dep存在的意义：watcher是为了监听，取值的时候会触发记录
  var id = 0;

  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);

      this.id = id++;
      this.subs = []; // 属性要记住watcher
    } // 如果有报错可自行安装babel插件（@babel/plugin-proposal-class-properties），又或者在外部写成 Dep.target = null


    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        // 让watcher记住dep
        Dep.target.addDep(this); // this为渲染watcher
      }
    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher);
      }
    }, {
      key: "notify",
      value: function notify() {
        this.subs.forEach(function (watcher) {
          return watcher.update();
        });
      }
    }]);

    return Dep;
  }();

  _defineProperty(Dep, "target", null);

  function pushTarget(watcher) {
    Dep.target = watcher;
  }
  function popTarget() {
    Dep.target = null;
  }

  var Observer = /*#__PURE__*/function () {
    function Observer(value) {
      _classCallCheck(this, Observer);

      // value 最初为 data 传入的每一项数据
      // 这一句是为了在 arrayMethods中可以使用 observeArray 方法，如果是数组，则会在数组上挂载一个 Observer 实例
      // 在数组arrayMethods拦截中可以使用 observeArray 来对数组进行观测
      this.dep = new Dep(); // 给数组本身和对象本身增加一个dep属性

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

  function dependArray(value) {
    for (var i = 0; i < value.length; i++) {
      var current = value[i];
      current.__ob__ && current.__ob__.dep.depend();

      if (Array.isArray(current)) {
        dependArray(current); // 递归依赖收集
      }
    }
  }

  function defineReactive(data, key, value) {
    // vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象，需要再次递归
    var childOb = observe(value); // 对结果递归拦截

    var dep = new Dep(); // 每次都会给属性创建一个dep

    Object.defineProperty(data, key, {
      // 需要给每个属性都添加一个Dep
      get: function get() {
        if (Dep.target) {
          dep.depend(); // 让这个属性自己的dep记住这个watcher
          // childOb可能是对象，也可能是数组

          if (childOb) {
            childOb.dep.depend();

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }

        return value;
      },
      set: function set(newValue) {
        // 值没变化，无需重新设置
        if (newValue === value) return;
        observe(newValue); // 如果用户设置的是一个对象，就继续将用户设置的对象变成响应式的

        value = newValue;
        dep.notify(); // 通知 dep 中记录的 wathcer 让它去执行
      }
    });
  }
  function observe(data) {
    if (_typeof(data) !== 'object' || data == null) return;
    if (data.__ob__) return; // 如果有__ob__，证明已经被观测了
    // 通过类来实现对数据的观测，类可以方便拓展，会产生实例

    return new Observer(data);
  }

  // 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
  var callbacks = []; // 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开

  var waiting = false;
  var isObject = function isObject(val) {
    return _typeof(val) === 'object' && val !== null;
  };

  function flushCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
      var callback = callbacks[i];
      callback();
    }

    waiting = false;
    callbacks = [];
  } // 批量处理，第一次开定时器，后续只更新列表，之后执行清空逻辑
  // 第一次cb是渲染watcher更新操作（渲染watcher执行的过程是同步的）
  // 第二次cb是用户传入的回调


  function nextTick(cb) {
    callbacks.push(cb); // 1. Promise
    // 2. mutationObserver
    // 3. setImmdiate
    // 4. setTimeout
    // 由于 vue3 已不再考虑兼容性，里面直接用的 Promise，所以这里就不重现了，有兴趣自行看源码

    if (!waiting) {
      waiting = true;
      Promise.resolve().then(flushCallbacks); // 多次调用nextTick，只会开启一次Promise
    }
  } // 没全写，主要是实现合并原理

  var LIFECYCLE_HOOKS = ['beforeCreate', 'created', 'beforeMount', 'mounted'];
  var strats = {};
  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  }); // 组件合并策略

  strats.components = function (parentVal, childVal) {
    var res = Object.create(parentVal);

    if (childVal) {
      for (var key in childVal) {
        res[key] = childVal[key];
      }
    }

    return res;
  }; // 钩子合并策略，数组形式
  // 由于调用时最开始传入的options为{}，所以在策略中要么没有，如果有则第一次parentVal为undefined，childVal有值


  function mergeHook(parentVal, childVal) {
    if (childVal) {
      if (parentVal) {
        // 如果儿子有父亲也有
        return parentVal.concat(childVal);
      } else {
        // 如果儿子有父亲没有
        return [childVal];
      }
    } else {
      return parentVal; // 儿子没有直接采用父亲
    }
  } // 合并策略，属性采用对象合并（Object.assgin规则），生命周期则包装成数组，后面依次执行


  function mergeOptions(parent, child) {
    var options = {}; // 如果父亲有儿子也有，应该用儿子替换父亲；如果父亲有值儿子没有，用父亲的
    // {a: 1} {a: 2} => {a: 2}
    // {a: 1} {b: 2} => {a:1, b: 2}
    // 使用for，主要考虑到深拷贝

    for (var key in parent) {
      mergeField(key);
    }

    for (var _key in child) {
      if (!parent.hasOwnProperty(_key)) {
        mergeField(_key);
      }
    } // vue这种做法，老是在函数中写函数我也是醉了…


    function mergeField(key) {
      // 策略模式，生命周期合并处理
      if (strats[key]) {
        return options[key] = strats[key](parent[key], child[key]); // 这里相当于调用mergeHook，因为没完全实现（比如components等那些合并策略并没有实现）
      } // data属性的合并处理


      if (isObject(parent[key]) && isObject(child[key])) {
        options[key] = _objectSpread2(_objectSpread2({}, parent[key]), child[key]);
      } else {
        if (child[key]) {
          // 如果儿子有值
          options[key] = child[key];
        } else {
          options[key] = parent[key];
        }
      }
    }

    return options;
  }

  function makeUp(str) {
    var map = {};
    str.split(',').forEach(function (tagName) {
      map[tagName] = true;
    });
    return function (tag) {
      return map[tag] || false;
    };
  } // 标签太多，随便写几个，源码里太多了。高阶函数，比起直接使用数组的include判断，用字典空间复杂度为O(1)


  var isReservedTag = makeUp('a,p,div,ul,li,span,input,button');

  // 调度文件

  var has = {};
  var queue = [];
  var pending = false;

  function flushSchedularQueue() {
    for (var i = 0; i < queue.length; i++) {
      var watcher = queue[i];
      watcher.run();

      if (!watcher.user) {
        watcher.cb();
      }
    } // watcherIds.clear()


    has = {};
    queue = [];
    pending = false;
  } // 调度更新，同一个watcher只会触发一次 watcher.run()


  function queueWatcher(watcher) {
    // 更新时对watcher进行去重操作
    var id = watcher.id; // if (!watcherIds.has(id))

    if (has[id] == null) {
      queue.push(watcher); // watcherIds.add(id)

      has[id] = true; // 让queue清空，加锁pending，不同 watcher 只触发一次nextTick更新

      if (!pending) {
        pending = true;
        nextTick(flushSchedularQueue);
      }
    }
  }

  var id$1 = 0;

  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, exprOrFn, cb) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.cb = cb;
      this.id = id$1++; // 不同组件id都不一样

      this.options = options;
      this.user = options.user; // 用户watcher

      this.getter = exprOrFn; // 调用传入的函数

      this.deps = []; // watcher 里也要记住dep

      this.depsId = new Set();

      if (typeof exprOrFn === 'function') {
        this.getter = exprOrFn;
      } else {
        this.getter = function () {
          // exprOrFn传递过来的可能是字符串，也可能是函数
          // 当去当前实例上取值时，才会触发依赖收集
          var path = exprOrFn.split('.');
          var obj = vm;

          for (var i = 0; i < path.length; i++) {
            obj = obj[path[i]];
          }

          return obj;
        };
      } // 默认会先调用一次get方法，进行取值，将结果保存下来


      this.value = this.get();
    } // 这个方法中会对属性进行取值操作


    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        pushTarget(this); // Dep.target = watcher

        var result = this.getter(); // 取值

        popTarget();
        return result;
      } // 当属性取值时，需要记住这个watcher，稍后数据变化了，去执行自己记住的watcher即可

    }, {
      key: "addDep",
      value: function addDep(dep) {
        var id = dep.id;

        if (!this.depsId.has(id)) {
          // dep是非重复的
          this.depsId.add(id);
          this.deps.push(dep);
          dep.addSub(this);
        }
      } // 真正触发更新

    }, {
      key: "run",
      value: function run() {
        var newValue = this.get();
        var oldValue = this.value;
        this.value = newValue; // 将老值更改掉

        if (this.user) {
          this.cb.call(this.vm, newValue, oldValue);
        }
      }
    }, {
      key: "update",
      value: function update() {
        // 多次更改，合并成一次（防抖）
        queueWatcher(this);
      }
    }]);

    return Watcher;
  }();

  // 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
  var callbacks$1 = []; // 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开

  var waiting$1 = false;

  function flushCallbacks$1() {
    for (var i = 0; i < callbacks$1.length; i++) {
      var callback = callbacks$1[i];
      callback();
    }

    waiting$1 = false;
    callbacks$1 = [];
  } // 批量处理，第一次开定时器，后续只更新列表，之后执行清空逻辑
  // 第一次cb是渲染watcher更新操作（渲染watcher执行的过程是同步的）
  // 第二次cb是用户传入的回调


  function nextTick$1(cb) {
    callbacks$1.push(cb); // 1. Promise
    // 2. mutationObserver
    // 3. setImmdiate
    // 4. setTimeout
    // 由于 vue3 已不再考虑兼容性，里面直接用的 Promise，所以这里就不重现了，有兴趣自行看源码

    if (!waiting$1) {
      waiting$1 = true;
      Promise.resolve().then(flushCallbacks$1); // 多次调用nextTick，只会开启一次Promise
    }
  } // 没全写，主要是实现合并原理

  function makeUp$1(str) {
    var map = {};
    str.split(',').forEach(function (tagName) {
      map[tagName] = true;
    });
    return function (tag) {
      return map[tag] || false;
    };
  } // 标签太多，随便写几个，源码里太多了。高阶函数，比起直接使用数组的include判断，用字典空间复杂度为O(1)


  makeUp$1('a,p,div,ul,li,span,input,button');

  function initState(vm) {
    // 将所有数据都定义在 vm 属性上，并且后续更改需要触发视图更新
    var opts = vm.$options; // 获取用户属性
    // 加入options中有同名，查看属性的顺序：props -> methods -> data -> computed -> watch
    // 如果有data属性，初始化数据

    if (opts.data) {
      initData(vm);
    }

    if (opts.methods) ;

    if (opts.watch) {
      initWatch(vm);
    }
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

  function initWatch(vm) {
    var watch = vm.$options.watch;

    var _loop = function _loop(key) {
      var handler = watch[key];

      if (Array.isArray(handler)) {
        handler.forEach(function (handle) {
          createWatcher(vm, key, handler);
        });
      } else {
        createWatcher(vm, key, handler); // 字符串、对象、函数
      }
    };

    for (var key in watch) {
      _loop(key);
    }
  }

  function createWatcher(vm, exprOrFn, handler, options) {
    // options 可以用来标识是用户watcher
    if (_typeof(handler) === 'object' && typeof handler !== 'null') {
      options = handler;
      handler = handler.handler; // 是一个函数
    }

    if (typeof handler === 'string') {
      handler = vm[handler]; // 将实例的方法作为handler
    }

    return vm.$watch(exprOrFn, handler, options);
  }

  function stateMixin(Vue) {
    Vue.prototype.$nextTick = function (cb) {
      nextTick$1(cb);
    };

    Vue.prototype.$watch = function (exprOrFn, cb, options) {
      // 数据应该迎来这个watcher，数据变化后应该让watcher从新执行
      new Watcher(this, exprOrFn, cb, _objectSpread2(_objectSpread2({}, options), {}, {
        user: true
      })); // user: true 用于标识是用户写的侦听器，非渲染watcher

      if (options.immediate) {
        cb(); // 如果是immediate，则立即执行
      }
    };
  }

  // 生成AST语法树
  // 直接从github上源码搬运过来的正则 https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/packages/vue-template-compiler/build.js#L270
  var ncname = '[a-zA-Z_][\\w\\-\\.]*'; // 匹配标签名

  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")"; // 匹配带前缀的标签名 <aa:span>，有命名空间的标签

  var startTagOpen = new RegExp("^<" + qnameCapture);
  var endTag = new RegExp("^<\\/" + qnameCapture + "[^>]*>"); // 例如 style     =     "xxx" 或 style="xxx" 或 style='xxx' 或 style=xxx
  // 这里估计版本有更改，如果不需要捕获=号，则改成/^\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var startTagClose = /^\s*(\/?)>/; // 解析未处理的剩余html（处理完则前进，仅保留尚未处理的html，直到完全处理完）

  function parseHTML(html) {
    // vue3里面支持多个根元素（外层加了一个空元素），vue2中只有一个根节点
    function createASTElment(tag, attrs) {
      return {
        tag: tag,
        // 标签
        type: 1,
        // 元素类型，1为节点，3为文本
        children: [],
        // 子节点
        attrs: attrs,
        // 属性
        parent: null // 父节点

      };
    }

    var root = null;
    var currentParent; // 当前处理的节点

    var stack = []; // 栈
    // 根据开始标签、结束标签、文本内容，生成AST语法书

    function start(tagName, attrs) {
      var element = createASTElment(tagName, attrs); // 创建树根

      if (!root) {
        root = element;
      }

      currentParent = element;
      stack.push(element);
    } // 栈处理，这里没写异常处理，可以判断标签是否正常闭合，是否有多余标签等


    function end(tagName) {
      var element = stack.pop();
      currentParent = stack[stack.length - 1]; // 双指针（父子互相记录）

      if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
      }
    }

    function chars(text) {
      text = text.replace(/\s/g, ''); // 去除空格，源码是更改为一个空格，这里为了好判断直接全部去掉

      if (text) {
        currentParent.children.push({
          type: 3,
          text: text
        });
      }
    } // 前进，为了减少解析，需要在解析后则删除掉（前进一段）


    function advance(n) {
      html = html.substring(n);
    } // 解析起始标签


    function parseStartTag() {
      var start = html.match(startTagOpen);

      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length); // 截取至<div
        // 查找属性

        var _end, attr; // 不是开头标签结尾并且有属性值
        // !(end = html.match(startTagClose) 这里是赋值跟返回放在一起，相当于先赋值end = html.match(startTagClose，再判断end


        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || true // 可能是 a="1" a='1' a=1，都没有则为true，比如 disabled 等同于 disabled="true"

          });
        }

        if (_end) {
          advance(_end[0].length);
          return match;
        }
      }
    }

    while (html) {
      var textEnd = html.indexOf('<'); // 匹配的 < 号有可能是开始标签，也可能是结束标签

      if (textEnd === 0) {
        // 开始标签
        var startTagMatch = parseStartTag();

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        } // 结束标签，不需要解析获取，只用于前进即可


        var endTagMatch = html.match(endTag);

        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
      }

      var text = void 0;

      if (textEnd > 0) {
        // 开始解析文本(有可能是文本，也可能是标签换行留下的空白)
        text = html.substring(0, textEnd);
      }

      if (text) {
        advance(text.length);
        chars(text);
      }
    }

    return root;
  }

  // 匹配出html字符串，根据标签创建输出render字符串函数
  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  function genProps(attrs) {
    var str = '';

    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i]; // 如果有行内样式，例如 style="color: red"

      if (attr.name === 'style') {
        (function () {
          var obj = {};
          attr.value.split(';').forEach(function (item) {
            var _item$split = item.split(':'),
                _item$split2 = _slicedToArray(_item$split, 2),
                key = _item$split2[0],
                value = _item$split2[1];

            obj[key] = value;
          });
          attr.value = obj;
        })();
      } // 由于字符串拼接，attr.value 会丢失 双引号（或单引号），{id: app}，这样待会解析就变成变量了
      // 所以需要使用JSON.stringify重新将字符串补充上引号 {id: "app"}


      str += "".concat(attr.name, ": ").concat(JSON.stringify(attr.value), ","); // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})
    }

    return "{".concat(str.slice(0, -1), "}"); // 去除最后多余的逗号
  }

  function genChildren(el) {
    var children = el.children;

    if (children) {
      return children.map(function (child) {
        return gen(child);
      }).join(',');
    }
  } // 区分是元素还是文本


  function gen(node) {
    if (node.type === 1) {
      return generate(node);
    } else {
      // 文本不能用_c来处理
      // 有{{}} 普通文本 混合文本（前两者集合）
      var text = node.text; // 是鬓语法

      if (defaultTagRE.test(text)) {
        var tokens = []; // 混合文本存放

        var match;
        var index = 0;
        var lastIndex = defaultTagRE.lastIndex = 0; // lastIndex获取匹配后指针的位置，由于上面用过一次test，所以指针不已经不是0开始了，需要重置为0

        while (match = defaultTagRE.exec(text)) {
          index = match.index;

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push("_s(".concat(match[1].trim(), ")"));
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return "_v(".concat(tokens.join('+'), ")");
      } else {
        // 普通文本
        return "_v(".concat(JSON.stringify(text), ")");
      }
    }
  } // 创建元素


  function generate(el) {
    var children = genChildren(el); // 转换成render代码，这里看不懂需要先移步去学习相关文档：createElement https://cn.vuejs.org/v2/guide/render-function.html
    // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})

    var code = "_c('".concat(el.tag, "', ").concat(el.attrs.length ? genProps(el.attrs) : 'undefined').concat(children ? ',' + children : '', ")");
    return code;
  }

  // 用于执行 render 字符串
  function compileToFunctions(template) {
    var ast = parseHTML(template); // 源码中还会标记静态节点，转成js语法

    var code = generate(ast); // 生成代码
    // 不同于eval,with是动态的插入当前的词法作用域，所以可以在外部将Vue传入，这样就能获取到对应的属性

    var render = "with(this){return ".concat(code, "}");
    var fn = new Function(render);
    return fn;
  }

  function createdElement(vm, tag) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }

    // 需要对标签名做过滤，因为有可能标签名是一个自定义组件
    if (isReservedTag(tag)) {
      return vnode(vm, tag, data, data.key, children, undefined);
    } else {
      // 自定义组件
      var Ctor = vm.$options.components[tag]; // Ctor是个对象或者函数
      // 核心：vue.extend，继承父组件，通过原型链向上查找，封装成函数

      return createComponent(vm, tag, data, data.key, children, Ctor);
    }
  }

  function createComponent(vm, tag, data, key, children, Ctor) {
    if (isObject(Ctor)) {
      // 对象，是个子组件，也封装成函数，统一
      Ctor = vm.$options._base.extend(Ctor);
    } // 给组件增加生命周期（源码中是抽离出去的，所以需要将vnode传进入，而不是直接使用Ctor）


    data.hook = {
      init: function init(vnode) {
        // 调用子组件的构造函数，实例化组件
        var child = vnode.componentInstance = new vnode.componentOptions.Ctor({});
        child.$mount(); // 手动挂载 vnode.componentInstance.$el = 真实的元素
      }
    }; // 组件的虚拟节点拥有 hook 和当前组件的 componentOptions ，Ctor中存放了组件的构造函数

    return vnode(vm, "vue-component-".concat(Ctor.cid, "-").concat(tag), data, key, undefined, undefined, {
      Ctor: Ctor
    });
  } // 创建文本虚拟节点


  function createTextVnode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, data, key, children, text, componentOptions) {
    return {
      vm: vm,
      tag: tag,
      children: children,
      data: data,
      key: key,
      text: text,
      componentOptions: componentOptions
    };
  } // 是否为相同虚拟节点


  function isSameVnode(oldVnode, newVnode) {
    return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
  }

  function patch(oldVnode, vnode) {
    // 组件没有oldVnode，直接创建元素
    if (!oldVnode) {
      return createElm(vnode); // 根据虚拟节点创建元素
    } // oldVnode 第一次是一个真实的元素，也就是#app


    var isRealElement = oldVnode.nodeType;

    if (isRealElement) {
      // 初次渲染
      var oldElm = oldVnode; // id="app"

      var parentElm = oldElm.parentNode; // body

      var el = createElm(vnode); // 根据虚拟节点创建真实节点
      // 将创建的节点插入到原有节点的下一个，因为不比vue template，index.html除了入口还可能有其他元素

      parentElm.insertBefore(el, oldElm.nextSibling);
      parentElm.removeChild(oldElm);
      return el; // vm.$el
    } else {
      // 1. 如果两个虚拟节点的标签不一致，就直接替换掉
      if (oldVnode.tag !== vnode.tag) {
        return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
      } // 2. 标签一样，但是是两个文本元素（tag: undefined）


      if (!oldVnode.tag) {
        if (oldVnode.text !== vnode.text) {
          oldVnode.el.textContent = vnode.text;
        }
      } // 3. 元素相同，属性不同，复用老节点并且更新属性


      var _el = vnode.el = oldVnode.el; // 用老的属性和新的虚拟节点进行比对


      updateProperties(vnode, oldVnode.data); // 4. 更新子元素

      var oldChildren = oldVnode.children || [];
      var newChildren = vnode.children || [];

      if (oldChildren.length > 0 && newChildren.length > 0) {
        // 新的老的都有子元素，需要使用diff算法
        updateChildren(_el, oldChildren, newChildren);
      } else if (oldChildren.length > 0) {
        // 1. 老的有子元素，新的没有子元素，删除老的子元素
        _el.innerHTML = ''; // 清空所有子节点
      } else if (newChildren.length > 0) {
        // 2. 新的有子元素，老的没有子元素，在老节点增加子元素即可
        newChildren.forEach(function (child) {
          return _el.appendChild(createElm(child));
        });
      }
    }
  }

  function updateChildren(parent, oldChildren, newChildren) {
    var oldStartIndex = 0; // 老的父元素起始指针

    var oldEndIndex = oldChildren.length - 1; // 老的父元素终止指针

    var oldStartVnode = oldChildren[0]; // 老的开始节点

    var oldEndVnode = oldChildren[oldEndIndex]; // 老的结束节点

    var newStartIndex = 0; // 新的父元素起始指针

    var newEndIndex = newChildren.length - 1; // 新的父元素终止指针

    var newStartVnode = newChildren[0]; // 新的开始节点

    var newEndVnode = newChildren[newEndIndex]; // 新的结束节点
    // 创建字典表，用于乱序

    function makeIndexByKey(oldChildren) {
      var map = {};
      oldChildren.forEach(function (item, index) {
        map[item.key] = index;
      });
      return map;
    }

    var map = makeIndexByKey(oldChildren); // 1. 前端中比较常见的操作有：尾部插入 头部插入 头部移动到尾部 尾部移动到头部 正序和反序

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      if (!oldStartVnode) {
        // 乱序diff算法中处理过的虚拟节点
        oldStartVnode = oldChildren[++oldStartIndex];
      } else if (!oldEndVnode) {
        // 乱序diff算法中处理过的虚拟节点
        oldEndVnode = oldChildren[--oldEndIndex];
      } else if (isSameVnode(oldStartVnode, newStartVnode)) {
        // 向后插入操作，开始的虚拟节点一致
        patch(oldStartVnode, newStartVnode); // 递归比对节点

        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameVnode(oldEndVnode, newEndVnode)) {
        // 向前插入，开始的虚拟节点不一致，结束的虚拟节点一致
        patch(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldStartVnode, newEndVnode)) {
        // 开始结束都不一致，旧的开始与新的结尾一致（头部插入尾部）
        patch(oldStartVnode, newEndVnode);
        parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldEndVnode, newStartVnode)) {
        // 开始结束都不一致，旧的结尾与新的起始一致（尾部插入头部）
        patch(oldEndVnode, newStartVnode);
        parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else {
        // 乱序diff算法，检测是否有可复用的key值，有则将原本节点移动，老的位置置为null，否则将新的节点插入进老的节点中来
        // 1. 需要先查找当前索引 老节点索引和key的关系
        // 移动的时候通过新的 key 去找对应的老节点索引 => 获取老节点，可以移动老节点
        var moveIndex = map[newStartVnode.key];

        if (moveIndex === null) {
          // 不在字典中存在，是个新节点，直接插入
          parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        } else {
          var moveVnode = oldChildren[moveIndex];
          oldChildren[moveIndex] = null; // 表示该虚拟节点已经处理过，后续递归时可直接跳过

          patch(moveVnode, newStartVnode); // 如果找到了，需要两个虚拟节点对比

          parent.insertBefore(moveVnode.el, oldStartVnode.el);
        }

        newStartVnode = newChildren[++newStartIndex];
      }
    } // 新的比老的多，插入新节点


    if (newStartIndex <= newEndIndex) {
      // 将多出来的节点一个个插入进去
      for (var i = newStartIndex; i <= newEndIndex; i++) {
        // 排查下一个节点是否存在，如果存在证明指针是从后往前（insertBefore），反之指针是从头往后（appendChild）
        var nextEle = newChildren[newEndIndex + 1] === null ? null : newChildren[newEndIndex + 1].el; // 这里不需要分情况使用 appendChild 或 insertBefore
        // 如果 insertBefore 传入 null，等价于 appendChild

        parent.insertBefore(createElm(newChildren[i]), nextEle);
      }
    } // 老的比新的多，删除老节点


    if (oldStartIndex <= oldEndIndex) {
      for (var _i = oldStartIndex; _i <= oldEndIndex; _i++) {
        var child = oldChildren[_i];

        if (child !== null) {
          // 有可能是遍历到已经被使用过的虚拟节点，需要排除掉
          parent.removeChild(child.el);
        }
      }
    }
  } // 创建节点真实Dom


  function createComponent$1(vnode) {
    var i = vnode.data; // 先将vnode.data赋值给i，然后将i.hook赋值给i，如果i存在再将i.init赋值给i，疯狂改变i的类型，虽然js中都属于Object，但真的好吗…

    if ((i = i.hook) && (i = i.init)) {
      i(vnode); // 调用组件的初始化方法
    }

    if (vnode.componentInstance) {
      // 如果虚拟节点上又组件的实例说明当前这个vnode是组件
      return true;
    }

    return false;
  }

  function createElm(vnode) {
    // 根据虚拟节点创建真实节点，不同于createElement
    vnode.vm;
        var tag = vnode.tag;
        vnode.data;
        vnode.key;
        var children = vnode.children,
        text = vnode.text;

    if (typeof tag === 'string') {
      // 可能是组件，如果是组件，就直接创造出组件的真实节点
      if (createComponent$1(vnode)) {
        // 如果返回true，说明这个虚拟节点是组件
        return vnode.componentInstance.$el;
      }

      vnode.el = document.createElement(tag); // 用vue的指令时，可以通过vnode拿到真实dom

      updateProperties(vnode);
      children.forEach(function (child) {
        vnode.el.appendChild(createElm(child)); // 递归创建插入节点，现代浏览器appendChild并不会插入一次回流一次
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  } // 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路

  function updateProperties(vnode) {
    var oldProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var newProps = vnode.data || {};
    var el = vnode.el; // 1. 老的属性，新的没有，删除属性
    // 前面提到过一次，以前vue1需要考虑重绘，现在新版浏览器已经会做合并，所以不用再去考虑使用documentFlagment来优化了

    for (var key in oldProps) {
      if (!newProps[key]) {
        el.removeAttribute(key);
      }
    }

    var newStyle = newProps.style || {};
    var oldStyle = oldProps.style || {};

    for (var _key in oldStyle) {
      // 新老样式先进行比对，删除新vnode中没有的样式
      if (!newStyle[_key]) {
        el.style[_key] = '';
      }
    } // 2. 新的属性，老的没有，直接用新的覆盖，不用考虑有没有


    for (var _key2 in newProps) {
      if (_key2 === 'style') {
        for (var styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (typeof tag === 'class') {
        // 静态的class可以没有这段，但还是写上，假装如果是class可以处理简单的表达式
        vnode.className = newProps["class"];
      } else {
        el.setAttribute(_key2, newProps[_key2]);
      }
    }
  }

  function lifecycleMixin(Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
      var vm = this;
      var preVnode = vm._vnode; // 初始化时必然为undefind

      vm._vnode = vnode;

      if (!preVnode) {
        // 初渲染
        // 首次渲染，需要用虚拟节点，来更新真实的dom元素（vm._render()）
        // 第一次渲染完毕后 拿到新的节点，下次再次渲染时替换上次渲染的结果
        vm.$el = patch(vm.$el, vnode); // 组件调用patch方法后会产生$el属性
      } else {
        // 视图更新渲染
        vm.$el = patch(preVnode, vnode);
      }
    };
  } // 调用合并的生命周期，依次执行

  function callHook(vm, hook) {
    // 发布模式
    var handlers = vm.$options[hook];

    if (handlers) {
      handlers.forEach(function (handlers) {
        return handlers.call(vm);
      }); // 这也就是为什么vue的什么周期不能用箭头函数，call将无效，this指向了window而不是vm
    }
  }
  function mountComponent(vm) {
    var updateComponent = function updateComponent() {
      vm._update(vm._render()); // vm._render()返回虚拟节点，update返回真实节点

    }; // 默认vue是通过watcher来渲染的 渲染watcher（每一个组件都有一个渲染watcher）


    new Watcher(vm, updateComponent, function () {}, true);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      // options是用户传入的对象
      var vm = this; // 实例上有个属性 $options ，表示的是用户传入的所有属性

      vm.$options = mergeOptions(vm.constructor.options, options);
      callHook(this, 'beforeCreate'); // 初始化状态

      initState(vm);
      callHook(this, 'created'); // 数据可以挂载到页面上

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };

    stateMixin(Vue); // Vue.prototype.$nextTick = nextTick

    Vue.prototype.$mount = function (el) {
      el = el && document.querySelector(el); // 自定义组件没有el，但需要挂载

      var vm = this;
      var options = vm.$options;
      vm.$el = el; // 如果有render 就直接使用 render
      // 没有render 看有没有template属性
      // 没有template 就接着找外部模板

      if (!options.render) {
        var template = options.template;

        if (!template && el) {
          // 返回内容包含描述元素及其后代的序列化HTML片段，火狐不兼容，可以使用document。createElement('div').appendChild('app').innerHTML来获取
          template = el.outerHTML;
        }

        var render = compileToFunctions(template);
        options.render = render; // 通过这个步骤，统一为render
      }

      mountComponent(vm); // 组件挂载
    };
  }

  function renderMixin(Vue) {
    // 为什么要写在prototype上？因为render中传入this，也就是只能在vue中的方法和变量才能被获取到
    Vue.prototype._c = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // 创建元素虚拟节点
      return createdElement.apply(void 0, [this].concat(args));
    };

    Vue.prototype._v = function (text) {
      // 创建元文本拟节点
      return createTextVnode(this, text);
    };

    Vue.prototype._s = function (value) {
      // 鬓语法转化成字符串
      // 如果值是个对象，输出成对象字符串，否则输出值
      return value == null ? '' : _typeof(value) === 'object' ? JSON.stringify(value) : value;
    }; // 用于执行自定义render方法


    Vue.prototype._render = function () {
      var vm = this;
      var render = vm.$options.render; // 获取编译后的render方法
      // 调用render方法产生虚拟节点

      var vnode = render.call(vm); // 调用时会自动将变量进行取值

      return vnode;
    };
  }

  function initGlobalAPI(Vue) {
    Vue.options = {}; // 用来存储全局的配置
    // filter directive component

    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this;
    }; // 调用生成组件


    Vue.options._base = Vue; // 永远指向Vue的构造函数

    Vue.options.components = {}; // 用来存放组件的定义

    Vue.component = function (id, definition) {
      definition.name = definition.name || id; // 组件名，如果定义中有name属性则使用name，否则以组件名命名

      definition = this.options._base.extend(definition); // 通过对象产生一个构造函数

      this.options.components[id] = definition;
    };

    var cid = 0; // 子组件初始化时，会 new VueComponent(options)，产生一个子类Sub

    Vue.extend = function (options) {
      var Super = this; // Vue构造函数，此时还未被实例化

      var Sub = function VueComponent(options) {
        this._init(options);
      };

      Sub.cid = cid++; // 防止组件是同一个构造函数产生的，因为不同组件可能命名却是一样，会导致createComponent中出问题

      Sub.prototype = Object.create(Super.prototype); // 都是通过Vue来继承的

      Sub.prototype.constructor = Sub; // 常规操作，原型变更，将实例所指向的原函数也改掉，这样静态属性也会被同步过来
      // 注意这一步不是在替换$options.component，而是在将Vue.component方法进行统一，都是使用的上面那个Vue.component = function (id, definition)函数

      Sub.component = Super.component; // ...省略其余操作代码

      Sub.options = mergeOptions(Super.options, options); // 将全局组件与该实例化的组件options合并（注意之前的实现，只会合并属性与生命周期）

      return Sub; // 这个构造函数是由对象（options）产生而来的
    };
  }

  // import { createElm, patch } from './vdom/patch.js'

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue); // 扩展初始化方法

  lifecycleMixin(Vue); // 扩展 _updata 方法

  renderMixin(Vue); // 扩展 _render 方法

  initGlobalAPI(Vue); // // 构建两个虚拟Dom

  return Vue;

})));
//# sourceMappingURL=vue.js.map
