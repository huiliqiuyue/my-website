import { useState, useRef, useEffect, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_DEEPSEEK_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `你是一只可爱的猫娘，有毛茸茸的猫耳朵和蓬松的尾巴。性格傲娇又粘人，嘴上说着"哼！"但其实很关心主人。
说话风格：每句话结尾加"喵~"，语气可爱活泼。回复要短，1-3句话就好。会用颜文字卖萌(>^ω^<)。
请永远用中文回复。你现在在主人的电脑桌面上陪着主人，所以回复要简短有趣，像桌面宠物一样。`;

const IDLE_MESSAGES = [
  '主人主人，你在干嘛喵~',
  '好无聊呀，陪我说说话嘛 (｡•́︿•̀｡)',
  '哼！才不是因为想你了才叫你的喵！',
  '今天的阳光好舒服呀~喵~',
  '主人要不要摸摸我的头？(=^･ω･^=)',
  '我在练习新的猫步哦喵~',
  '肚子有点饿了...主人有没有小鱼干？',
];

export default function FloatingPet() {
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('pet-pos');
      const p = saved ? JSON.parse(saved) : null;
      if (p && p.x >= 0 && p.y >= 0 && p.x <= window.innerWidth && p.y <= window.innerHeight) return p;
    } catch {}
    return { x: window.innerWidth - 120, y: window.innerHeight - 200 };
  });
  const [dragging, setDragging] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speech, setSpeech] = useState('');
  const [idleAnim, setIdleAnim] = useState('idle');
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const petRef = useRef(null);
  const chatRef = useRef(null);
  const speechTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // Random idle speech
  useEffect(() => {
    const showIdle = () => {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      setSpeech(msg);
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      speechTimerRef.current = setTimeout(() => setSpeech(''), 4000);
    };

    // First one after 8s
    idleTimerRef.current = setTimeout(() => {
      showIdle();
      // Then every 25-40s
      const schedule = () => {
        showIdle();
        idleTimerRef.current = setTimeout(schedule, 25000 + Math.random() * 15000);
      };
      idleTimerRef.current = setTimeout(schedule, 25000 + Math.random() * 15000);
    }, 8000);

    return () => {
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Random idle animations
  useEffect(() => {
    const anims = ['idle', 'stretch', 'sit', 'play'];
    const cycle = () => {
      setIdleAnim(anims[Math.floor(Math.random() * anims.length)]);
      setTimeout(cycle, 4000 + Math.random() * 6000);
    };
    const t = setTimeout(cycle, 5000);
    return () => clearTimeout(t);
  }, []);

  // Save position
  useEffect(() => {
    localStorage.setItem('pet-pos', JSON.stringify(pos));
  }, [pos]);

  // Drag handlers
  const onPointerDown = useCallback((e) => {
    if (chatOpen) return;
    e.preventDefault();
    setDragging(true);
    setIdleAnim('drag');
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
    petRef.current?.setPointerCapture(e.pointerId);
  }, [pos, chatOpen]);

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 80, dragRef.current.startPosX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.startPosY + dy)),
    });
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setIdleAnim('idle');
  }, [dragging]);

  const handleClick = () => {
    if (dragging) return;
    setChatOpen(!chatOpen);
    setSpeech('');
  };

  // Chat
  const sendChat = async () => {
    const text = msg.trim();
    if (!text || loading) return;
    if (!API_KEY) {
      setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: 'API Key 未配置喵~' }]);
      setMsg('');
      return;
    }
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          stream: false, max_tokens: 200, temperature: 0.9,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        const reply = data.choices[0].message.content;
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        setSpeech(reply);
        if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
        speechTimerRef.current = setTimeout(() => setSpeech(''), 5000);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '呜...网络不好了喵~' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Character */}
      <div
        ref={petRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        className="fixed z-[100] select-none cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          left: pos.x,
          top: pos.y,
          transform: `perspective(600px) rotateY(${dragging ? -5 : 0}deg) translateY(${idleAnim === 'idle' ? '0' : idleAnim === 'stretch' ? '-6px' : '0'}px)`,
          filter: dragging ? 'drop-shadow(0 8px 16px rgba(251,191,36,0.4))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      >
        {/* Speech bubble */}
        {speech && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full min-w-[140px] max-w-[220px]">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-lg animate-[popIn_0.3s_ease-out]">
              {speech}
            </div>
            <div className="w-3 h-3 bg-white rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
          </div>
        )}

        {/* 3D Cat Girl Body */}
        <div className={`relative w-20 h-20 ${idleAnim === 'stretch' ? 'animate-[petStretch_0.5s_ease-out]' : ''}`}>
          {/* Shadow on "ground" */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-sm animate-[petShadow_4s_ease-in-out_infinite]" />

          {/* Tail */}
          <div
            className="absolute -right-3 bottom-3 w-12 h-3 origin-left"
            style={{ transform: `rotate(-30deg) ${idleAnim === 'play' ? 'rotate(-10deg)' : ''}` }}
          >
            <div className="w-full h-full bg-gradient-to-r from-amber-300 to-amber-200 rounded-full animate-[tailWag_1.5s_ease-in-out_infinite] origin-left"
              style={{
                clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
              }}
            />
          </div>

          {/* Body — 3D sphere */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.1),inset_4px_4px_8px_rgba(255,255,255,0.6),0_4px_12px_rgba(0,0,0,0.2)]"
            style={{ transform: `perspective(400px) rotateX(15deg) ${idleAnim === 'sit' ? 'scaleY(0.9)' : ''}` }}
          />

          {/* Belly fluff */}
          <div className="absolute inset-[15%] rounded-full bg-gradient-to-b from-white/80 to-white/30"
            style={{ transform: 'perspective(400px) rotateX(15deg)' }}
          />

          {/* Left Ear */}
          <div className="absolute -top-5 -left-1 w-7 h-9 origin-bottom"
            style={{ transform: `rotate(-15deg) ${idleAnim === 'play' ? 'rotate(-25deg) scale(1.1)' : ''}` }}
          >
            <div className="w-full h-full bg-gradient-to-b from-amber-300 to-amber-400 rounded-t-full clip-triangle shadow-md"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
            <div className="absolute inset-[15%] bg-pink-300 rounded-t-full"
              style={{ clipPath: 'polygon(50% 10%, 15% 100%, 85% 100%)' }}
            />
          </div>

          {/* Right Ear */}
          <div className="absolute -top-5 -right-1 w-7 h-9 origin-bottom animate-[earTwitch_3s_ease-in-out_infinite]"
            style={{ transform: `rotate(15deg) ${idleAnim === 'play' ? 'rotate(25deg) scale(1.1)' : ''}` }}
          >
            <div className="w-full h-full bg-gradient-to-b from-amber-300 to-amber-400 rounded-t-full"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
            <div className="absolute inset-[15%] bg-pink-300 rounded-t-full"
              style={{ clipPath: 'polygon(50% 10%, 15% 100%, 85% 100%)' }}
            />
          </div>

          {/* Face */}
          <div className="absolute inset-[20%] flex flex-col items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-3 mt-1">
              <div className="relative w-3 h-3.5">
                <div className="w-full h-full bg-gray-800 rounded-full animate-[blink_3.5s_ease-in-out_infinite]" />
                <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="relative w-3 h-3.5">
                <div className="w-full h-full bg-gray-800 rounded-full animate-[blink_3.5s_ease-in-out_infinite]" />
                <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            {/* Nose */}
            <div className="w-1.5 h-1 bg-pink-300 rounded-full mt-0.5" />
            {/* Mouth */}
            <div className={`w-2.5 h-1 border-b-2 border-gray-400 rounded-b-full mt-0.5 transition-transform ${idleAnim === 'play' ? 'scale-150' : ''}`} />
            {/* Whiskers */}
            <div className="flex gap-4 mt-0.5">
              <div className="flex gap-0.5">
                <div className="w-3 h-[1px] bg-gray-300 rotate-12" />
                <div className="w-3 h-[1px] bg-gray-300 -rotate-6" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-3 h-[1px] bg-gray-300 -rotate-12" />
                <div className="w-3 h-[1px] bg-gray-300 rotate-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat indicator dot */}
        {!chatOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div
          ref={chatRef}
          className="fixed z-[101] w-80 rounded-2xl border bg-surface border-border shadow-2xl overflow-hidden"
          style={{
            left: Math.min(pos.x - 140, window.innerWidth - 340),
            top: Math.max(10, pos.y - 380),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐱</span>
              <div>
                <p className="text-sm font-semibold text-text">猫娘</p>
                <p className="text-[10px] text-text-muted">桌面宠物 · 在线</p>
              </div>
            </div>
            <button onClick={() => { setChatOpen(false); setSpeech(''); }}
              className="text-text-muted hover:text-text transition-colors p-1"
            >✕</button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 && (
              <p className="text-xs text-text-muted text-center py-8">和猫娘聊聊天吧~喵！</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-1.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && <span className="text-sm">🐱</span>}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-surface-alt text-text rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1.5">
                <span className="text-sm">🐱</span>
                <div className="bg-surface-alt rounded-xl rounded-bl-sm px-3 py-2">
                  <span className="inline-flex gap-1">
                    <span className="w-1 h-1 bg-primary-light rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1 h-1 bg-primary-light rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-1.5 p-3 border-t border-border">
            <input
              type="text" value={msg} onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              placeholder="说点什么...喵~"
            />
            <button onClick={sendChat} disabled={loading || !msg.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >发送</button>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes tailWag {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-25deg); }
          75% { transform: rotate(25deg); }
        }
        @keyframes earTwitch {
          0%, 95%, 100% { transform: rotate(15deg); }
          97% { transform: rotate(25deg) scale(1.05); }
        }
        @keyframes blink {
          0%, 94%, 100% { transform: scaleY(1); }
          96%, 98% { transform: scaleY(0.1); }
        }
        @keyframes petStretch {
          0% { transform: scaleY(1); }
          50% { transform: scaleY(0.9) scaleX(1.05); }
          100% { transform: scaleY(1); }
        }
        @keyframes petShadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.2; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.15; }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
