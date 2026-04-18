import { useState } from 'react';
import { VirtualFile } from '../types';
import { FileCode, FileText, Folder, ChevronRight, Download, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { extractZip, downloadZip } from '../services/zipService';

interface FileViewerProps {
  files: VirtualFile[];
  setFiles: (files: VirtualFile[]) => void;
}

export default function FileViewer({ files, setFiles }: FileViewerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const extracted = await extractZip(file);
      setFiles(extracted);
      if (extracted.length > 0) {
        setSelectedPath(extracted[0].path);
      }
    } catch (error) {
      console.error("Failed to extract zip:", error);
      alert("Failed to extract zip file. See console for details.");
    }
    // reset input
    event.target.value = '';
  };

  const handleDownload = async () => {
    if (files.length === 0) return;
    await downloadZip(files);
  };

  const selectedFile = files.find((f) => f.path === selectedPath);

  return (
    <div className="flex flex-col h-full bg-[#1a1c23] rounded-[24px] overflow-hidden border border-[#334155] shadow-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
        <h2 className="font-semibold text-[#f1f5f9]">Repository</h2>
        <div className="flex space-x-3">
          <label className="cursor-pointer inline-flex flex-shrink-0 items-center px-4 py-2 text-sm font-medium text-[#94a3b8] bg-[#252833] hover:text-[#f1f5f9] rounded-xl transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Upload ZIP
            <input type="file" accept=".zip" className="hidden" onChange={handleFileUpload} />
          </label>
          <button
            onClick={handleDownload}
            disabled={files.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#3b82f6] hover:bg-blue-500 disabled:bg-[#252833] disabled:text-[#94a3b8] disabled:border-transparent rounded-xl transition-colors shadow-[0_4px_12px_rgba(59,130,246,0.3)] disabled:shadow-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Export App
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-[#334155] overflow-y-auto p-4 flex flex-col gap-1">
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#94a3b8] text-sm italic">
              No files uploaded
            </div>
          ) : (
            <div className="space-y-0.5">
              {files.map((file) => {
                const isSelected = selectedPath === file.path;
                return (
                 <button
                   key={file.path}
                   onClick={() => setSelectedPath(file.path)}
                   className={cn(
                     "w-full flex items-center text-left px-3 py-2 rounded-xl text-sm transition-colors border",
                     isSelected ? "bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[#3b82f6]" : "text-[#94a3b8] hover:bg-[#252833] border-transparent hover:text-[#f1f5f9]"
                   )}
                 >
                   <FileCode className={cn("w-4 h-4 mr-2", isSelected ? "text-[#3b82f6]" : "text-[#94a3b8]")} />
                   <span className="truncate">{file.path}</span>
                 </button>
                )
              })}
            </div>
          )}
        </div>

        {/* File Content Preview */}
        <div className="flex-1 overflow-auto bg-[#000] m-4 rounded-2xl border border-[#334155] p-5">
          {selectedFile ? (
            <pre className="text-[13px] leading-[1.6] font-mono text-[#a5b4fc] whitespace-pre-wrap break-words">
              {selectedFile.content}
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-[#94a3b8]">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
