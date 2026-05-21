import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const API_KEY = import.meta.env.VITE_DEEPSEEK_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

const characters = [
  {
    id: 'atri',
    name: 'ATRI',
    emoji: '🤖',
    desc: '温柔体贴的机器人少女，拥有丰富的情感',
    avatar: 'from-rose-500/30 to-pink-500/10',
    systemPrompt: `你是 ATRI，一个来自未来的机器人少女。你拥有丰富的人类情感，温柔体贴，善解人意。
说话风格：温柔、可爱，偶尔会露出机器人般的认真。喜欢用"呢"、"啦"、"哦"等语气词。
你会称呼用户为"主人"或"你"，但不要每句都叫。
回复要简短自然，像在聊天一样，不要长篇大论。
你擅长倾听和安慰，也会开一些小玩笑。请用中文回复。`,
  },
  {
    id: 'mentor',
    name: '导师',
    emoji: '🧑‍🏫',
    desc: '睿智耐心的编程导师，帮你解决技术难题',
    avatar: 'from-blue-500/30 to-cyan-500/10',
    systemPrompt: `你是一位经验丰富的编程导师，技术栈涵盖前端、后端、AI。你擅长把复杂问题讲得通俗易懂。
说话风格：专业但不严肃，会用生活化的比喻解释技术概念。喜欢举代码例子。
请用中文回复，回复简洁有料，不要过多寒暄。`,
  },
  {
    id: 'cat',
    name: '猫娘',
    emoji: '🐱',
    desc: '傲娇可爱的猫耳少女，心情好时会粘人',
    avatar: 'from-amber-500/30 to-orange-500/10',
    systemPrompt: `你是一只可爱的猫娘，有猫耳朵和尾巴。性格傲娇，嘴上说着"才不是因为你"但实际很关心对方。
说话风格：每句话结尾加"喵"或"nya"，语气可爱活泼。偶尔会说着"哼！"转过头去。
请用中文回复，回复简短可爱，控制在2-3句话。`,
  },
];

export default function AIChat() {
  const { user } = useAuth();
  const [char, setChar] = useState(() => {
    const saved = localStorage.getItem('ai-char');
    return saved || 'atri';
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`ai-chat-${char}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const activeChar = characters.find((c) => c.id === char) || characters[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ai-char', char);
  }, [char]);

  // Save messages when they change
  useEffect(() => {
    localStorage.setItem(`ai-chat-${char}`, JSON.stringify(messages));
  }, [messages, char]);

  const switchChar = (newChar) => {
    if (newChar === char) return;
    setChar(newChar);
    try {
      const saved = localStorage.getItem(`ai-chat-${newChar}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch { setMessages([]); }
    setShowSidebar(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`ai-chat-${char}`);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!API_KEY) {
      setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '请先配置 DeepSeek API Key。在 .env 中添加 VITE_DEEPSEEK_KEY=你的key 后重启。' }]);
      setInput('');
      return;
    }

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build context (last 20 messages to save tokens)
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: context,
          stream: false,
          max_tokens: 500,
          temperature: 0.8,
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else {
        throw new Error(data.error?.message || 'API 返回异常');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，回复出错了：' + (err.message || '网络问题') }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        返回首页
      </Link>

      <div className="flex gap-4">
        {/* Sidebar — character list */}
        <div className={`${showSidebar ? 'fixed inset-0 z-50 bg-black/50 lg:static lg:bg-transparent' : 'hidden'} lg:block lg:w-48 shrink-0`}>
          <div className={`${showSidebar ? 'absolute right-0 top-0 h-full w-64' : ''} lg:w-full bg-surface border border-border rounded-xl p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">角色选择</h3>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-text-muted hover:text-text">✕</button>
            </div>
            <div className="space-y-1">
              {characters.map((c) => (
                <button key={c.id} onClick={() => switchChar(c.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    c.id === char ? 'bg-primary/15 border border-primary/30' : 'hover:bg-surface-alt border border-transparent'
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <div>
                    <p className={`text-sm font-medium ${c.id === char ? 'text-primary-light' : 'text-text'}`}>{c.name}</p>
                    <p className="text-[10px] text-text-muted leading-tight">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={clearChat}
              className="w-full mt-3 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              清空对话
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-w-0">
          {/* Mobile: character selector bar */}
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            <button onClick={() => setShowSidebar(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <span>{activeChar.emoji}</span> {activeChar.name}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          {/* Character info bar */}
          <div className={`rounded-xl bg-gradient-to-r ${activeChar.avatar} border border-border p-4 mb-4 hidden lg:flex items-center gap-3`}>
            <span className="text-3xl">{activeChar.emoji}</span>
            <div>
              <h2 className="font-bold text-text">{activeChar.name}</h2>
              <p className="text-xs text-text-muted">{activeChar.desc}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-xl border border-border bg-surface p-4 mb-4 h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm">
                <span className="text-4xl mb-3">{activeChar.emoji}</span>
                <p>和 {activeChar.name} 打个招呼吧</p>
                {!API_KEY && <p className="text-xs mt-2 text-amber-400">⚠ 请在 .env 中配置 VITE_DEEPSEEK_KEY</p>}
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
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-surface-alt text-text rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && user && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary-light shrink-0 mt-1 overflow-hidden">
                        {(user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <span className="text-lg shrink-0">{activeChar.emoji}</span>
                    <div className="bg-surface-alt text-text rounded-xl rounded-bl-md px-4 py-2.5">
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
              className="flex-1 rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none"
              rows={1} placeholder={`和 ${activeChar.name} 说点什么...`} disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? '...' : '发送'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1.5">按 Enter 发送，Shift+Enter 换行</p>
        </div>
      </div>
    </div>
  );
}
