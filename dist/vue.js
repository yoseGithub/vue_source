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


      if (inserted) {
        ob.observeArray(inserted);
      } // 调用数组原有方法执行


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
  function popTarget(watcher) {
    Dep.target = null;
  }

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

    var dep = new Dep(); // 每次都会给属性创建一个dep

    Object.defineProperty(data, key, {
      // 需要给每个属性都添加一个Dep
      get: function get() {
        if (Dep.target) {
          dep.depend(); // 让这个属性自己的dep记住这个watcher
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

  // 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
  var callbacks = []; // 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开

  var waiting = false;

  function flushCallbacks() {
    console.log('产生异步任务');

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
  }

  // 调度文件

  var has = {};
  var queue = [];
  var pending = false;

  function flushSchedularQueue() {
    for (var i = 0; i < queue.length; i++) {
      var watcher = queue[i];
      watcher.run();
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
    function Watcher(vm, exprOrFn, cb, options) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.cb = cb;
      this.id = id$1++; // 不同组件id都不一样

      this.options = options;
      this.getter = exprOrFn; // 调用传入的函数

      this.deps = []; // watcher 里也要记住dep

      this.depsId = new Set();
      this.get();
    } // 这个方法中会对属性进行取值操作


    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        pushTarget(this); // Dep.target = watcher

        this.getter(); // 取值

        popTarget();
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
        console.log('触发视图更新');
        this.get();
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

  // 将虚拟节点转换成真实节点
  function patch(oldVnode, newVnode) {
    // oldVnode 第一次是一个真实的元素，也就是#app
    var isRealElement = oldVnode.nodeType;

    if (isRealElement) {
      // 初次渲染
      var oldElm = oldVnode; // id="app"

      var parentElm = oldElm.parentNode; // body

      var el = createdElm(newVnode); // 根据虚拟节点创建真实节点
      // 将创建的节点插入到原有节点的下一个，因为不比vue template，index.html除了入口还可能有其他元素

      parentElm.insertBefore(el, oldElm.nextSibling);
      parentElm.removeChild(oldElm);
      return el; // vm.$el
    }
  }

  function createdElm(vnode) {
    // 根据虚拟节点创建真实节点，不同于createElement
    vnode.vm;
        var tag = vnode.tag;
        vnode.data;
        vnode.key;
        var children = vnode.children,
        text = vnode.text;

    if (typeof tag === 'string') {
      // 可能是组件
      vnode.el = document.createElement(tag); // 用vue的指令时，可以通过vnode拿到真实dom

      updateProperties(vnode);
      children.forEach(function (child) {
        vnode.el.appendChild(createdElm(child)); // 递归创建插入节点，现代浏览器appendChild并不会插入一次回流一次
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  } // 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路


  function updateProperties(vnode) {
    var newProps = vnode.data || {};
    var el = vnode.el;

    for (var key in newProps) {
      if (key === 'style') {
        for (var styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (typeof tag === 'class') {
        // 静态的class可以没有这段，但还是写上，假装如果是class可以处理简单的表达式
        vnode.className = newProps["class"];
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  function lifecycleMixin(Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
      var vm = this; // 首次渲染，需要用虚拟节点，来更新真实的dom元素
      // 第一次渲染完毕后 拿到新的节点，下次再次渲染时替换上次渲染的结果

      vm.$options.el = patch(vm.$options.el, vnode);
    };
  }
  function mountComponent(vm, el) {
    var updateComponent = function updateComponent() {
      vm._update(vm._render()); // vm._render()返回虚拟节点，update返回真实节点

    }; // 默认vue是通过watcher来渲染的 渲染watcher（每一个组件都有一个渲染watcher）


    new Watcher(vm, updateComponent, function () {}, true);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this; // 实例上有个属性 $options ，表示的是用户传入的所有属性

      vm.$options = options; // 初始化状态

      initState(vm); // 数据可以挂载到页面上

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$nextTick = nextTick;

    Vue.prototype.$mount = function (el) {
      el = document.querySelector(el);
      var vm = this;
      var options = vm.$options;
      vm.$options.el = el; // 如果有render 就直接使用 render
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

  // 创建 Dom虚拟节点
  function createdElement(vm, tag) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }

    return vnode(vm, tag, data, data.key, children, undefined);
  } // 创建文本虚拟节点

  function createTextVnode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, data, key, children, text) {
    return {
      vm: vm,
      tag: tag,
      children: children,
      data: data,
      key: key,
      text: text
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

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue); // 扩展初始化方法

  lifecycleMixin(Vue); // 扩展 _updata 方法

  renderMixin(Vue); // 扩展 _render 方法

  return Vue;

})));
//# sourceMappingURL=vue.js.map
