import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User as UserIcon, Minimize2 } from 'lucide-react';
import { apiRequest } from '../utils/apiClient.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Kumusta! I am your **Cainta Photography Studio AI Concierge**. Ask me anything about local studios (near Cainta Rotonda, Felix Ave, Valley Golf), packages, GCash QR payments, or photo proofing!"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Best graduation portrait studios in Cainta?',
    'How does PayMongo GCash downpayment work?',
    'What are photo proofing watermarks?',
    'Are walk-ins accepted in Ortigas Ave Ext studios?'
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (userPrompt?: string) => {
    const query = userPrompt || input;
    if (!query.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const res = await apiRequest<{ reply: string }>('/api/chatbot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm sorry, I encountered a temporary connection issue. Please feel free to ask again or browse our Studio Directory directly!"
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="btn-open-chatbot"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#2c2a29] hover:bg-stone-800 text-white rounded-2xl shadow-2xl border border-stone-700 transition-all hover:scale-105 active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-tight">Studio AI Assistant</div>
            <div className="text-[10px] text-amber-400">Ask about Cainta shoots</div>
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-scaleUp">
          {/* Header */}
          <div className="bg-[#2c2a29] text-white p-4 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs leading-tight">Cainta Studio Concierge</h4>
                <p className="text-[10px] text-amber-400">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 text-xs">
                    🤖
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-600 text-white rounded-br-sm'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-sm shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-stone-400 text-xs pl-8 animate-pulse">
                <span>Studio Concierge is typing...</span>
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="p-2 bg-stone-100/70 border-t border-stone-200 flex gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-800 text-stone-700 rounded-lg border border-stone-200 transition-colors shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-stone-200 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about rates, slots, or Cainta locations..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
