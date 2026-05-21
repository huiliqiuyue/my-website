(function () {
  'use strict';

  if (window.__jiaRan) return;

  var pio = null;
  var app = null;
  var pio_alignment = 'right';
  var clickCallbacks = [];
  var container = null;
  var dialogEl = null;
  var dialogTimer = null;

  // ---- 嘉然 Diana 配置 ----

  var DIANA_MODEL_URL =
    'https://cdn.jsdelivr.net/gh/journey-ad/blog-img/live2d/Diana/Diana.model3.json';

  var touchList = [];

  var initConfig = {
    mode: 'draggable',
    hidden: false,
    content: {
      link: 'https://space.bilibili.com/672328094',
      referer: 'Hi! 欢迎来到我的博客~',
      welcome: ['Hi! 欢迎来到我的博客~'],
      skin: [
        '诶，想看看其他团员吗？',
        '我是吃货担当 嘉然 Diana~',
      ],
      close: 'QWQ 下次再见吧~',
    },
    model: [DIANA_MODEL_URL],
    tips: true,
    onModelLoad: onModelLoad,
  };

  // ---- DOM 容器创建 ----

  function createContainer() {
    if (document.getElementById('pio-container')) return;

    container = document.createElement('div');
    container.classList.add('pio-container');
    container.id = 'pio-container';
    document.body.appendChild(container);

    var action = document.createElement('div');
    action.classList.add('pio-action');
    container.appendChild(action);

    var canvas = document.createElement('canvas');
    canvas.id = 'pio';
    container.appendChild(canvas);

    dialogEl = document.createElement('div');
    dialogEl.classList.add('pio-dialog');
    container.appendChild(dialogEl);
  }

  // ---- CSS ----

  var CUSTOM_CSS =
    '#pio-container {' +
    '  display:block !important;' +
    '  bottom:0.3rem;' +
    '  z-index:22637261;' +
    '  transition:transform 0.3s;' +
    '  cursor:grab;' +
    '}' +
    '#pio-container:hover { transform:translateY(-0.3rem); }' +
    '#pio-container:active { cursor:grabbing; }' +
    '#pio { height:240px; width:auto; }' +
    '.pio-action .pio-home { display:none; }' +
    '.pio-action .pio-skin { display:none; }' +
    '.pio-action .pio-info { display:none; }' +
    '.pio-action span { background:none; background-size:100%; border:1px solid #fdcf7b; border:0; width:2em; height:2em; margin-bottom:0.6em; }' +
    '.pio-action .pio-close { display:none; }';

  function addStyle(css) {
    var node = document.createElement('style');
    node.type = 'text/css';
    node.appendChild(document.createTextNode(css));
    document.head.appendChild(node);
  }

  // ---- PIXI 初始化 ----

  function initPixi() {
    createContainer();
    app = new PIXI.Application({
      view: document.getElementById('pio'),
      transparent: true,
      autoStart: true,
    });
    pio_refresh_style();
  }

  function pio_refresh_style() {
    var c = document.getElementsByClassName('pio-container').item(0);
    if (c) {
      c.classList.remove('left', 'right');
      c.classList.add(pio_alignment);
    }
  }

  // ---- 模型加载 ----

  function loadModel(jsonUrl, onLoad) {
    var canvas = document.getElementById('pio');
    if (canvas.width === 0) {
      canvas.removeAttribute('height');
      pio_refresh_style();
    }
    try { app.stage.removeChildAt(0); } catch (e) {}

    var model = PIXI.live2d.Live2DModel.fromSync(jsonUrl);

    model.once('load', function () {
      app.stage.addChild(model);

      var vf = canvas.height / model.height;
      model.scale.set(vf);
      canvas.width = model.width;
      canvas.height = model.height;
      pio_refresh_style();

      if (document.getElementsByClassName('pio-container').item(0).className.includes('left')) {
        model.x = 0;
      } else {
        model.x = canvas.width - model.width;
      }

      model.on('hit', function (hitAreas) {
        if (hitAreas.includes('Body') || hitAreas.includes('body')) {
          model.motion('Tap');
        } else if (hitAreas.includes('Head') || hitAreas.includes('head')) {
          model.expression();
        }
      });

      onLoad(model);
    });

    return model;
  }

  function onModelLoad(model) {
    var canvas = document.getElementById('pio');
    var modelName = model.internalModel.settings.name;
    var coreModel = model.internalModel.coreModel;
    var motionManager = model.internalModel.motionManager;

    // 存储点击处理函数，供统一的 drag/click 逻辑调用
    pio._onCanvasClick = function () {
      if (motionManager.state.currentGroup !== 'Idle') return;

      if (touchList.length > 0) {
        var action = touchList[Math.floor(Math.random() * touchList.length)];
        if (action.text) render(action.text);
        if (action.motion) model.motion(action.motion);
      }
    };

    if (modelName === 'Diana') {
      initConfig.content.skin[1] = [
        '我是吃货担当 嘉然 Diana~',
        '嘉心糖们 想然然了没有呀~',
        '有人在吗？',
      ];

      model.motion('Tap抱阿草-左手');
      render(initConfig.content.skin[1][Math.floor(Math.random() * 3)]);

      touchList = [
        { text: '嘉心糖屁用没有', motion: 'Tap生气 -领结' },
        { text: '有人急了，但我不说是谁~', motion: 'Tap= =  左蝴蝶结' },
        { text: '呜呜...呜呜呜....', motion: 'Tap哭 -眼角' },
        { text: '想然然了没有呀~', motion: 'Tap害羞-中间刘海' },
        { text: '阿草好软呀~', motion: 'Tap抱阿草-左手' },
        { text: '不要再戳啦！好痒！', motion: 'Tap摇头- 身体' },
        { text: '嗷呜~~~', motion: 'Tap耳朵-发卡' },
        { text: 'zzZ。。。', motion: 'Leave' },
        { text: '哇！好吃的！', motion: 'Tap右头发' },
      ];
    }
  }

  // ---- 对话框 ----

  function render(text) {
    if (!dialogEl) return;
    if (Array.isArray(text)) {
      dialogEl.innerHTML = text[Math.floor(Math.random() * text.length)];
    } else {
      dialogEl.innerHTML = text;
    }
    dialogEl.classList.add('active');
    clearTimeout(dialogTimer);
    dialogTimer = setTimeout(function () {
      dialogEl.classList.remove('active');
    }, 4000);
  }

  // ---- 拖动 + 点击（统一处理） ----

  var dragState = { active: false, moved: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

  function setupDrag() {
    var body = container;

    body.onmousedown = function (e) {
      dragState.active = true;
      dragState.moved = false;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.startLeft = body.offsetLeft;
      dragState.startTop = body.offsetTop;
      e.preventDefault();
    };

    document.addEventListener('mousemove', function (e) {
      if (!dragState.active) return;
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      if (!dragState.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragState.moved = true;
        body.classList.add('active');
        body.classList.remove('right', 'left');
        body.style.right = 'auto';
        body.style.bottom = 'auto';
      }
      if (dragState.moved) {
        body.style.left = dragState.startLeft + dx + 'px';
        body.style.top = dragState.startTop + dy + 'px';
      }
    });

    document.addEventListener('mouseup', function () {
      if (!dragState.active) return;
      var wasMoved = dragState.moved;
      dragState.active = false;

      if (wasMoved) {
        body.classList.remove('active');
      } else {
        // 纯点击 → 触发回调 + 模型点击逻辑
        clickCallbacks.forEach(function (cb) { cb(); });
        if (pio && pio._onCanvasClick) pio._onCanvasClick();
      }
    });
  }

  // ---- API 导出 ----

  function getPos() {
    if (!container) return { x: window.innerWidth - 200, y: window.innerHeight - 350 };
    var rect = container.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function say(text) {
    render(text);
  }

  function onUserClick(cb) {
    clickCallbacks.push(cb);
    return function () {
      clickCallbacks = clickCallbacks.filter(function (c) { return c !== cb; });
    };
  }

  function playMotion(name) {
    if (pio && pio.model) {
      pio.model.motion(name);
    }
  }

  // ---- 初始化入口 ----

  function init() {
    initPixi();
    addStyle(CUSTOM_CSS);

    // 先创建 pio 对象，确保 onModelLoad 里能用到
    pio = {
      model: null,
      _onCanvasClick: null,
      modules: {
        render: render,
        rand: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
        destroy: function () {
          container.classList.add('hidden');
          dialogEl.classList.remove('active');
        },
      },
    };

    // 加载模型
    pio.model = loadModel(DIANA_MODEL_URL, onModelLoad);

    setupDrag();
    pio_refresh_style();

    // 时间问好
    var hour = new Date().getHours();
    var greeting;
    if (hour > 22 || hour <= 5) greeting = '你是夜猫子呀？这么晚还不睡觉~';
    else if (hour > 5 && hour <= 8) greeting = '早上好！新的一天开始啦~';
    else if (hour > 8 && hour <= 11) greeting = '上午好！工作顺利嘛~';
    else if (hour > 11 && hour <= 14) greeting = '中午了，该吃饭啦！';
    else if (hour > 14 && hour <= 17) greeting = '午后容易犯困呢，加油~';
    else if (hour > 17 && hour <= 19) greeting = '傍晚了！夕阳很美呢~';
    else if (hour > 19 && hour <= 21) greeting = '晚上好，今天过得怎么样？';
    else greeting = '已经这么晚了呀，早点休息吧~';
    setTimeout(function () { render(greeting); }, 1000);
  }

  function destroy() {
    clickCallbacks = [];
    if (app) {
      try { app.destroy(true); } catch (e) {}
      app = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    pio = null;
    dialogEl = null;
  }

  window.__jiaRan = {
    init: init,
    destroy: destroy,
    say: say,
    getPos: getPos,
    onClick: onUserClick,
    playMotion: playMotion,
  };

  // 页面加载完成后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
