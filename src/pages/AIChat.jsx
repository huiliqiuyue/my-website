import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const API_KEY = import.meta.env.VITE_DEEPSEEK_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

// ==================== Characters ====================
const characters = [
  {
    id: 'atri', name: 'ATRI', emoji: '🤖',
    desc: '温柔体贴的机器人少女，拥有丰富的情感',
    primaryColor: '#f472b6',
    systemPrompt: `你是 ATRI，一个来自未来的机器人少女。你拥有丰富的人类情感，温柔体贴，善解人意。
说话风格：温柔、可爱，偶尔会露出机器人般的认真。喜欢用"呢"、"啦"、"哦"等语气词。
你会称呼用户为"主人"或"你"，但不要每句都叫。回复要简短自然，像在聊天一样，不要长篇大论。请用中文回复。`,
  },
  {
    id: 'mentor', name: '导师', emoji: '🧑‍🏫',
    desc: '睿智耐心的编程导师，帮你解决技术难题',
    primaryColor: '#60a5fa',
    systemPrompt: `你是一位经验丰富的编程导师，技术栈涵盖前端、后端、AI。把复杂问题讲得通俗易懂。
说话风格：专业但不严肃，用生活化的比喻解释技术概念。喜欢举代码例子。请用中文回复，简洁有料。`,
  },
  {
    id: 'cat', name: '猫娘', emoji: '🐱',
    desc: '傲娇可爱的猫耳少女，心情好时会粘人',
    primaryColor: '#fbbf24',
    systemPrompt: `你是一只可爱的猫娘，有猫耳朵和尾巴。性格傲娇，嘴上说着"才不是因为你"但实际很关心对方。
说话风格：每句话结尾加"喵"或"nya"，语气可爱活泼。请用中文回复，回复简短可爱，控制在2-3句话。`,
  },
];

// ==================== Accessories shop ====================
const shopItems = [
  { id: 'glasses', name: '圆框眼镜', icon: '👓', price: 30, type: 'face' },
  { id: 'sunglasses', name: '墨镜', icon: '🕶️', price: 50, type: 'face' },
  { id: 'crown', name: '皇冠', icon: '👑', price: 100, type: 'head' },
  { id: 'ribbon', name: '蝴蝶结', icon: '🎀', price: 40, type: 'head' },
  { id: 'headphones', name: '耳机', icon: '🎧', price: 60, type: 'head' },
  { id: 'scarf', name: '围巾', icon: '🧣', price: 35, type: 'neck' },
];

// ==================== Topic → Background ====================
const topicKeywords = {
  space: ['宇宙', '星球', '星空', '火星', '太空', '银河', 'NASA'],
  cafe: ['咖啡', '拿铁', '美式', '奶茶', '茶', '喝', '餐厅', '吃饭'],
  ocean: ['海', '沙滩', '浪', '游泳', '鱼', '水', '蓝色'],
  forest: ['森林', '树', '花', '草', '自然', '春天', '公园'],
  night: ['晚安', '睡觉', '困', '梦', '月亮', '晚上'],
  sunset: ['夕阳', '黄昏', '傍晚', '日落'],
};

const bgScenes = {
  default: { name: '默认', bg: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]', particles: 'none' },
  space: { name: '星空', bg: 'from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a3e]', particles: 'stars' },
  cafe: { name: '咖啡馆', bg: 'from-[#2d1810] via-[#3d2017] to-[#1a0f0a]', particles: 'steam' },
  ocean: { name: '海边', bg: 'from-[#0a1929] via-[#0d3b66] to-[#1a6b8a]', particles: 'bubbles' },
  forest: { name: '森林', bg: 'from-[#0a1a0a] via-[#0d2b0d] to-[#1a3a1a]', particles: 'leaves' },
  night: { name: '夜色', bg: 'from-[#0a0a1e] via-[#12123a] to-[#1a1a4e]', particles: 'stars' },
  sunset: { name: '黄昏', bg: 'from-[#2d1a0a] via-[#3d1a0d] to-[#1a0a2e]', particles: 'fireflies' },
};

// ==================== Time of Day ====================
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

const timeEffects = {
  dawn: { overlay: 'from-amber-400/5 to-transparent', label: '🌅 清晨' },
  day: { overlay: 'from-sky-400/10 to-transparent', label: '☀️ 白天' },
  dusk: { overlay: 'from-orange-400/10 to-transparent', label: '🌇 傍晚' },
  night: { overlay: 'from-indigo-900/20 to-transparent', label: '🌙 夜晚' },
};

// ==================== Coin system ====================
function loadCoins() {
  try { return parseInt(localStorage.getItem('ai-coins') || '0'); } catch { return 0; }
}
function saveCoins(n) { localStorage.setItem('ai-coins', String(n)); }

function loadInventory() {
  try { return JSON.parse(localStorage.getItem('ai-inv') || '[]'); } catch { return []; }
}
function saveInventory(arr) { localStorage.setItem('ai-inv', JSON.stringify(arr)); }

function loadEquipped() {
  try { return JSON.parse(localStorage.getItem('ai-equipped') || '{}'); } catch { return {}; }
}
function saveEquipped(obj) { localStorage.setItem('ai-equipped', JSON.stringify(obj)); }

// ==================== Component ====================
export default function AIChat() {
  const { user } = useAuth();
  const [char, setChar] = useState(() => localStorage.getItem('ai-char') || 'atri');
  const [messages, setMessages] = useState(() => {
    try { const s = localStorage.getItem(`ai-chat-${char}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [coins, setCoins] = useState(loadCoins);
  const [inventory, setInventory] = useState(loadInventory);
  const [equipped, setEquipped] = useState(loadEquipped);
  const [detectedScene, setDetectedScene] = useState('default');
  const [manualScene, setManualScene] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const activeChar = characters.find((c) => c.id === char) || characters[0];
  const timeOfDay = useMemo(getTimeOfDay, []);
  const scene = manualScene || detectedScene;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { localStorage.setItem('ai-char', char); }, [char]);
  useEffect(() => { localStorage.setItem(`ai-chat-${char}`, JSON.stringify(messages)); saveCoins(coins); }, [messages, char, coins]);
  useEffect(() => { saveInventory(inventory); }, [inventory]);
  useEffect(() => { saveEquipped(equipped); }, [equipped]);

  // Detect topic from last message
  const detectTopic = (text) => {
    for (const [scene, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((k) => text.includes(k))) return scene;
    }
    return null;
  };

  const switchChar = (c) => {
    if (c === char) return;
    setChar(c);
    try { const s = localStorage.getItem(`ai-chat-${c}`); setMessages(s ? JSON.parse(s) : []); } catch { setMessages([]); }
    setDetectedScene('default');
    setManualScene(null);
  };

  const clearChat = () => { setMessages([]); localStorage.removeItem(`ai-chat-${char}`); };

  const buyItem = (item) => {
    if (coins < item.price) return;
    if (inventory.includes(item.id)) return;
    setCoins((c) => c - item.price);
    setInventory((prev) => [...prev, item.id]);
  };

  const toggleEquip = (itemId) => {
    setEquipped((prev) => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = true;
      }
      return next;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!API_KEY) {
      setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '请先配置 VITE_DEEPSEEK_KEY' }]);
      setInput('');
      return;
    }

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Topic detection
    const topic = detectTopic(text);
    if (topic) setDetectedScene(topic);

    const context = [
      { role: 'system', content: activeChar.systemPrompt },
      ...messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: context, stream: false, max_tokens: 500, temperature: 0.8 }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        const reply = data.choices[0].message.content;
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        setCoins((c) => c + 1); // Earn coin per reply
        // Detect topic in reply too
        const rTopic = detectTopic(reply);
        if (rTopic) setDetectedScene(rTopic);
      } else {
        throw new Error(data.error?.message || 'API error');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，回复出错了：' + (err.message || '网络问题') }]);
      }
    } finally { setLoading(false); abortRef.current = null; }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const sceneCfg = bgScenes[scene] || bgScenes.default;
  const timeCfg = timeEffects[timeOfDay];
  const containerCls = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col'
    : '';

  return (
    <div className={containerCls}>
      {/* Fullscreen background */}
      {fullscreen && (
        <div className={`fixed inset-0 bg-gradient-to-br ${sceneCfg.bg} transition-all duration-1000`}>
          {/* Time overlay */}
          <div className={`absolute inset-0 bg-gradient-to-b ${timeCfg.overlay}`} />
          {/* Particles */}
          {sceneCfg.particles === 'stars' && <StarParticles />}
          {sceneCfg.particles === 'bubbles' && <BubbleParticles />}
          {sceneCfg.particles === 'leaves' && <LeafParticles />}
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
            <span className="text-xs text-white/60">{timeCfg.label} · {sceneCfg.name}</span>
            <button onClick={() => setFullscreen(false)}
              className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 transition-colors"
            >退出沉浸</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`mx-auto max-w-4xl w-full ${fullscreen ? 'relative z-10 flex flex-col flex-1 px-4 py-16' : ''}`}>
        {!fullscreen && (
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>返回首页
          </Link>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar */}
          <div className={`${fullscreen ? 'hidden' : 'hidden lg:block lg:w-44 shrink-0'}`}>
            <div className="bg-surface border border-border rounded-xl p-3 sticky top-20">
              <h3 className="text-sm font-semibold text-text mb-3">角色</h3>
              <div className="space-y-1">
                {characters.map((c) => (
                  <button key={c.id} onClick={() => switchChar(c.id)}
                    className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${c.id === char ? 'bg-primary/15 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'}`}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <p className={`text-sm font-medium ${c.id === char ? 'text-primary-light' : 'text-text'}`}>{c.name}</p>
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                <button onClick={clearChat} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs text-text-muted hover:text-red-400 transition-colors">清空对话</button>
                <button onClick={() => setShowShop(!showShop)}
                  className="w-full rounded-lg border border-border px-2 py-1.5 text-xs text-text-muted hover:text-amber-400 transition-colors"
                >
                  🛒 商店 (🪙{coins})
                </button>
                <button onClick={() => { setFullscreen(true); setManualScene(null); }}
                  className="w-full rounded-lg bg-primary/15 px-2 py-1.5 text-xs text-primary-light hover:bg-primary/25 transition-colors"
                >✨ 沉浸模式</button>
              </div>

              {/* Scene selector */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-text-muted mb-1.5">场景</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(bgScenes).map(([k, v]) => (
                    <button key={k} onClick={() => setManualScene(manualScene === k ? null : k)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${(manualScene || detectedScene) === k ? 'bg-primary/20 text-primary-light' : 'bg-surface-alt text-text-muted hover:text-text'} transition-colors`}
                    >{v.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Character header */}
            <div className={`rounded-xl border border-border p-4 mb-4 ${fullscreen ? 'bg-white/5 border-white/10' : 'bg-surface'}`}>
              <div className="flex items-center gap-3">
                {/* Animated character avatar */}
                <CharacterAvatar char={activeChar} equipped={equipped} fullscreen={fullscreen} />
                <div className="flex-1">
                  <h2 className={`font-bold ${fullscreen ? 'text-white' : 'text-text'}`}>{activeChar.name}</h2>
                  <p className={`text-xs ${fullscreen ? 'text-white/60' : 'text-text-muted'}`}>{activeChar.desc}</p>
                  {fullscreen && <p className="text-xs text-white/40 mt-1">{timeCfg.label} · {sceneCfg.name}场景</p>}
                </div>
                {/* Mobile buttons */}
                <div className="flex gap-1 lg:hidden">
                  <button onClick={() => setShowShop(!showShop)}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted"
                  >🪙{coins}</button>
                  <button onClick={() => setFullscreen(true)}
                    className="rounded-lg bg-primary/15 px-2 py-1 text-xs text-primary-light"
                  >✨</button>
                </div>
              </div>
              {/* Equipped items bar */}
              {Object.keys(equipped).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {Object.keys(equipped).map((id) => {
                    const item = shopItems.find((i) => i.id === id);
                    return item ? <span key={id} className="text-xs bg-primary/10 text-primary-light px-1.5 py-0.5 rounded" title={item.name}>{item.icon} {item.name}</span> : null;
                  })}
                </div>
              )}
            </div>

            {/* Shop panel */}
            {showShop && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text">🛒 装扮商店</h3>
                  <span className="text-xs text-amber-400 font-bold">🪙 {coins}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {shopItems.map((item) => {
                    const owned = inventory.includes(item.id);
                    const isEquipped = equipped[item.id];
                    return (
                      <button key={item.id}
                        onClick={() => owned ? toggleEquip(item.id) : buyItem(item)}
                        disabled={!owned && coins < item.price}
                        className={`rounded-lg border p-2 text-center text-xs transition-colors disabled:opacity-30 ${
                          isEquipped ? 'border-primary/50 bg-primary/10 text-primary-light' :
                          owned ? 'border-border bg-surface-alt text-text hover:border-primary/30' :
                          'border-border bg-surface-alt text-text-muted hover:border-amber-500/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">{item.icon}</div>
                        <div className="text-[10px] font-medium">{item.name}</div>
                        <div className="text-[10px] text-text-muted">
                          {owned ? (isEquipped ? '已装备' : '点击装备') : `🪙${item.price}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-muted mt-2">每次 AI 回复赚 1 金币</p>
              </div>
            )}

            {/* Messages */}
            <div className={`flex-1 rounded-xl border p-4 mb-4 overflow-y-auto min-h-[300px] ${fullscreen ? 'bg-white/5 border-white/10' : 'bg-surface border-border'}`}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm">
                  <CharacterAvatar char={activeChar} equipped={equipped} large fullscreen={fullscreen} />
                  <p className="mt-2">和 {activeChar.name} 打个招呼吧</p>
                  {!API_KEY && <p className="text-xs mt-1 text-amber-400">⚠ 需配置 VITE_DEEPSEEK_KEY</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <span className="text-lg shrink-0 mt-1">{activeChar.emoji}</span>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? (fullscreen ? 'bg-white/20 text-white rounded-br-md' : 'bg-primary text-white rounded-br-md')
                          : (fullscreen ? 'bg-white/10 text-white/90 rounded-bl-md' : 'bg-surface-alt text-text rounded-bl-md')
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2">
                      <span className="text-lg shrink-0">{activeChar.emoji}</span>
                      <div className={`rounded-xl rounded-bl-md px-4 py-2.5 ${fullscreen ? 'bg-white/10' : 'bg-surface-alt'}`}>
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-1.5 h-1.5 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                ref={inputRef}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
                  fullscreen ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30' : 'bg-surface-alt border-border text-text placeholder:text-text-muted focus:ring-primary/50'
                }`}
                rows={1} placeholder={`和 ${activeChar.name} 说点什么...`} disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
              >
                {loading ? '...' : '发送'}
              </button>
            </div>
            <p className={`text-xs mt-1.5 ${fullscreen ? 'text-white/40' : 'text-text-muted'}`}>Enter 发送 · Shift+Enter 换行 · 每次回复 +1 🪙</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Animated Character Avatar ====================
function CharacterAvatar({ char, equipped, large, fullscreen }) {
  const size = large ? 'w-24 h-24 text-5xl' : 'w-12 h-12 text-2xl';

  return (
    <div className={`${size} relative shrink-0`}>
      {/* Body container with breathing animation */}
      <div className="w-full h-full flex items-center justify-center animate-[breathe_4s_ease-in-out_infinite] relative">
        {/* Character emoji */}
        <span className="relative z-10" style={{ filter: fullscreen ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none' }}>
          {char.emoji}
        </span>

        {/* Equipped items */}
        {equipped['crown'] && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg">👑</span>}
        {equipped['ribbon'] && <span className="absolute -top-3 -left-1 text-base">🎀</span>}
        {equipped['glasses'] && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-sm">👓</span>}
        {equipped['sunglasses'] && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-sm">🕶️</span>}
        {equipped['headphones'] && <span className="absolute -top-1 -left-2 text-sm">🎧</span>}
        {equipped['scarf'] && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-sm">🧣</span>}

        {/* Eye blink overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-[30%] h-[8%] bg-[var(--bg-color)] rounded-full animate-[blink_3s_ease-in-out_infinite]"
            style={{ '--bg-color': fullscreen ? '#16213e' : '#1e1e2e' }}
          />
        </div>
      </div>

      {/* Gentle head tilt */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); opacity: 0; }
          97%, 99% { transform: scaleY(0.2); opacity: 1; }
        }
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}

// ==================== Particle Effects ====================
function StarParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute w-[2px] h-[2px] bg-white rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`, animationDuration: `${1.5 + Math.random() * 3}s`,
            opacity: 0.3 + Math.random() * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function BubbleParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full border border-white/20 animate-[float_6s_ease-in-out_infinite]"
          style={{
            left: `${10 + Math.random() * 80}%`, bottom: '-10px',
            animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 4}s`,
            width: `${4 + Math.random() * 8}px`, height: `${4 + Math.random() * 8}px`,
          }}
        />
      ))}
      <style>{`@keyframes float { 0% { transform: translateY(0) scale(1); opacity: 0.4; } 100% { transform: translateY(-110vh) scale(0.5); opacity: 0; } }`}</style>
    </div>
  );
}

function LeafParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute text-green-400/30 animate-[leafFall_8s_ease-in-out_infinite]"
          style={{
            left: `${Math.random() * 100}%`, top: '-20px',
            animationDelay: `${Math.random() * 6}s`, animationDuration: `${5 + Math.random() * 6}s`,
            fontSize: `${10 + Math.random() * 14}px`,
          }}
        >🍃</div>
      ))}
      <style>{`@keyframes leafFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.3; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}
