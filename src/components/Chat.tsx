import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, FileArchive, Download, Loader2, BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSendMessage: (msg: string) => void;
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!thinking) return null;

  return (
    <div className="mb-4 text-[13px] border border-[#334155] bg-[#0b0c10] rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full px-4 py-2.5 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#252833] transition-colors"
      >
        <BrainCircuit className="w-4 h-4 mr-2" />
        <span className="font-medium mr-auto">Reasoning Process</span>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 pt-2 text-[#94a3b8] whitespace-pre-wrap font-mono text-xs"
          >
            {thinking}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Chat({ messages, isProcessing, onSendMessage }: ChatProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1c23] rounded-[24px] border border-[#334155] overflow-hidden">
      <div className="border-b border-[#334155] px-6 py-4 flex items-center">
        <h2 className="font-semibold text-[#f1f5f9] flex items-center">
          <BrainCircuit className="w-5 h-5 text-[#3b82f6] mr-2" />
          AI Builder Assistant
        </h2>
        <span className="ml-auto text-xs font-semibold bg-[#252833] text-[#3b82f6] px-3 py-1.5 rounded-xl border border-[#334155]">
          Thinking Level: HIGH
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] space-y-4">
            <div className="w-16 h-16 bg-[#252833] rounded-[24px] flex items-center justify-center mb-2 border border-[#334155]">
              <FileArchive className="w-8 h-8 text-[#94a3b8]" />
            </div>
            <p className="text-center max-w-sm">
              Upload a zip file to begin, then describe how you want to modify or enhance the application.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-[16px] px-5 py-3.5 shadow-sm",
                msg.role === 'user' 
                  ? "bg-[#3b82f6] text-white rounded-tr-sm" 
                  : "bg-[#252833] border border-[#334155] text-[#f1f5f9] rounded-tl-sm"
              )}
            >
              {msg.role === 'model' && msg.thinking && (
                <ThinkingBlock thinking={msg.thinking} />
              )}
              {msg.role === 'model' ? (
                <div className="prose prose-sm prose-invert max-w-none text-[#f1f5f9]">
                  <Markdown>{msg.content}</Markdown>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex w-full justify-start">
            <div className="bg-[#252833] border border-[#334155] rounded-[16px] rounded-tl-sm px-5 py-4 shadow-sm flex items-center space-x-3 text-[#94a3b8]">
              <Loader2 className="w-5 h-5 animate-spin text-[#3b82f6]" />
              <span className="text-sm font-medium animate-pulse">Thinking deeply...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#334155]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="E.g., 'Add a dark mode to index.css' or 'Create a new login component'"
            className="w-full bg-[#0b0c10] border border-[#334155] text-[#f1f5f9] rounded-xl py-3 pl-4 pr-14 focus:border-[#3b82f6] focus:outline-none placeholder-[#94a3b8] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 p-2 bg-[#3b82f6] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-[#3b82f6] transition-colors shadow-[0_4px_12px_rgba(59,130,246,0.3)] disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
