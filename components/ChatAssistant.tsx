import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Send, Sparkles, X, MessageSquare, Minimize2 } from 'lucide-react';
import { Chat } from "@google/genai";

interface ChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession("You are a helpful strategy assistant for a brand planner. Be concise and witty.");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I'm thinking...",
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-6 w-96 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col z-50 h-[600px] overflow-hidden ring-1 ring-black/50">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <h3 className="font-medium text-white text-sm">Strategy Assistant</h3>
        </div>
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/50">
        {history.length === 0 && (
          <div className="text-center text-neutral-500 mt-10 px-4">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Ask me anything about cultural trends, event logistics, or quick facts.</p>
          </div>
        )}
        {history.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-neutral-800 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
               <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
               <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100" />
               <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200" />
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800">
        <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-4 py-2 border border-neutral-700 focus-within:border-indigo-500 transition-colors">
          <input 
            type="text" 
            className="bg-transparent w-full text-sm text-white focus:outline-none placeholder-neutral-500"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
