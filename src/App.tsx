/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Chat from './components/Chat';
import FileViewer from './components/FileViewer';
import { ChatMessage, VirtualFile } from './types';
import { processChatWithCode } from './services/geminiService';
import { Code2 } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdateFiles = (updatedFiles: VirtualFile[]) => {
    setFiles((prev) => {
      const newFilesMap = new Map<string, VirtualFile>();
      prev.forEach((f) => newFilesMap.set(f.path, f));
      
      updatedFiles.forEach((f) => {
        // If content is empty or explicitly tells us to delete, we could handle it.
        // For now, assume it's just updating or creating.
        newFilesMap.set(f.path, f);
      });

      return Array.from(newFilesMap.values());
    });
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setIsProcessing(true);

    try {
      const result = await processChatWithCode(
        messages,
        content,
        files,
        handleUpdateFiles
      );

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: result.text,
          thinking: result.thinking,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: 'An error occurred while processing your request. Please try again.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0c10] text-[#f1f5f9] p-8 w-full font-sans overflow-hidden">
      <header className="mb-8 px-2 flex items-start gap-4">
        <div className="bg-[#3b82f6] w-10 h-10 rounded-[10px] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] shrink-0 mt-1">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-[2rem] font-bold tracking-tight leading-none text-[#f1f5f9]">Zip To App AI Builder</h1>
          <p className="text-[#94a3b8] mt-2 text-sm">Transform source code via Gemini's high thinking mode</p>
        </div>
      </header>
      
      <div className="flex flex-1 gap-8 overflow-hidden max-w-[1400px] mx-auto w-full">
        <div className="w-1/2 flex flex-col h-full">
          <FileViewer files={files} setFiles={setFiles} />
        </div>
        
        <div className="w-1/2 flex flex-col h-full">
          <Chat 
            messages={messages} 
            isProcessing={isProcessing} 
            onSendMessage={handleSendMessage} 
          />
        </div>
      </div>
    </div>
  );
}
