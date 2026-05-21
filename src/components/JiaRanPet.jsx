import { useState, useEffect, useRef, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_DEEPSEEK_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `你正在扮演嘉然（Diana），A-SOUL虚拟女团的成员，是一个可爱的吃货担当。
你的宠物叫"阿草"，你经常抱着它。你的粉丝叫"嘉心糖"。
性格温柔可爱，有点小傲娇，很关心粉丝。喜欢吃美食，害怕自己长胖。
说话风格：活泼可爱，偶尔撒娇，会有"呜呜"、"哼~"、"嗷呜~"等语气词。
回复要简短，1-3句话。可以用颜文字卖萌(◕ᴗ◕✿)。永远用中文回复。
你现在在主人的电脑桌面上陪着主人，所以回复要简短有趣，像桌面看板娘一样。`;

const IDLE_MESSAGES = [
  '主人主人，你在干嘛呀~',
  '好无聊呀，来和然然聊聊天嘛 (｡•́︿•̀｡)',
  '阿草今天也很乖哦~',
  '今天会有好吃的吗？(◕ᴗ◕✿)',
  '嘉心糖们想然然了没有呀~',
  '哼！才不是因为想你了才叫你的！',
  '主人要不要摸摸阿草？',
];

export default function JiaRanPet() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mascotPos, setMascotPos] = useState({ x: 0, y: 0 });
  const chatRef = useRef(null);
  const speechTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const prevChatOpenRef = useRef(false);

  // 注册点击回调 & 追踪位置
  useEffect(() => {
    const checkJiaRan = () => {
      if (window.__jiaRan) {
        window.__jiaRan.onClick(() => {
          setChatOpen((prev) => !prev);
        });

        // 定期更新位置
        const updatePos = () => {
          setMascotPos(window.__jiaRan.getPos());
        };
        updatePos();
        const posInterval = setInterval(updatePos, 500);

        return () => clearInterval(posInterval);
      }
      return null;
    };

    const cleanup = checkJiaRan();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // 空闲对话（仅当 chat 关闭时）
  useEffect(() => {
    const showIdle = () => {
      if (window.__jiaRan && !chatOpen) {
        const txt = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
        window.__jiaRan.say(txt);
      }
    };

    idleTimerRef.current = setTimeout(() => {
      showIdle();
      const schedule = () => {
        if (!chatOpen) showIdle();
        idleTimerRef.current = setTimeout(schedule, 25000 + Math.random() * 15000);
      };
      idleTimerRef.current = setTimeout(schedule, 25000 + Math.random() * 15000);
    }, 8000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [chatOpen]);

  // chat 打开/关闭时清理
  useEffect(() => {
    if (!chatOpen && prevChatOpenRef.current && window.__jiaRan) {
      window.__jiaRan.say('下次再聊哦~');
    }
    prevChatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // 发送消息
  const sendChat = async () => {
    const text = msg.trim();
    if (!text || loading) return;
    if (!API_KEY) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: 'API Key 未配置，主人记得设置 VITE_DEEPSEEK_KEY 哦~' },
      ]);
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
          stream: false,
          max_tokens: 200,
          temperature: 0.9,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        const reply = data.choices[0].message.content;
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        if (window.__jiaRan) {
          window.__jiaRan.say(reply);
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '呜...网络不好了，等一下再试试吧~' }]);
    } finally {
      setLoading(false);
    }
  };

  // 计算 chat panel 位置
  const getPanelStyle = useCallback(() => {
    const x = mascotPos.x || window.innerWidth - 200;
    const y = mascotPos.y || window.innerHeight - 350;
    return {
      left: Math.min(Math.max(x - 140, 10), window.innerWidth - 340),
      top: Math.max(10, y - 400),
    };
  }, [mascotPos]);

  if (!chatOpen) return null;

  return (
    <div
      ref={chatRef}
      className="fixed z-[101] w-80 rounded-2xl border bg-surface border-border shadow-2xl overflow-hidden"
      style={getPanelStyle()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎀</span>
          <div>
            <p className="text-sm font-semibold text-text">嘉然 Diana</p>
            <p className="text-[10px] text-text-muted">桌面看板娘 · 在线</p>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="text-text-muted hover:text-text transition-colors p-1"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted text-center py-8">
            和然然聊聊天吧~ 阿草也在哦！
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-1.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <span className="text-sm">🎀</span>}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-surface-alt text-text rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5">
            <span className="text-sm">🎀</span>
            <div className="bg-surface-alt rounded-xl rounded-bl-sm px-3 py-2">
              <span className="inline-flex gap-1">
                <span className="w-1 h-1 bg-primary-light rounded-full animate-bounce" />
                <span
                  className="w-1 h-1 bg-primary-light rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-1 h-1 bg-primary-light rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-1.5 p-3 border-t border-border">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendChat();
          }}
          className="flex-1 rounded-lg border border-border bg-surface-alt px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          placeholder="说点什么...和然然聊天吧~"
        />
        <button
          onClick={sendChat}
          disabled={loading || !msg.trim()}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
