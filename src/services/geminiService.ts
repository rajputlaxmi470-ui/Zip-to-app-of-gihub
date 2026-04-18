import { GoogleGenAI } from '@google/genai';
import { ChatMessage, VirtualFile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `You are an expert AI software engineer.
You are given a set of files from a source code ZIP.
Your goal is to understand the user's request and transform the code to make it a fully functional, enhanced application according to the request.
You MUST output the new or modified files using the following strict XML-like structure:

<files>
  <file path="path/to/file.ext">
     // file content here...
  </file>
</files>

If you are deleting a file, you can omit it or make it empty, but mostly focus on creating/updating files.
You can also provide some explanation outside the <files> tags.
Do not wrap the entire response in a markdown block if it just contains XML, but you can use markdown for the chat UI.
`;

export async function processChatWithCode(
  history: ChatMessage[],
  newMessage: string,
  files: VirtualFile[],
  onUpdate: (files: VirtualFile[]) => void
): Promise<{ text: string; thinking?: string }> {
  try {
    // We will pass the current state of files in the prompt.
    const fileContext = files.length > 0 
      ? `CURRENT FILES IN REPOSITORY:
${files.map(f => `<file path="${f.path}">
${f.content}
</file>`).join('\n')}

Please review these files and implement the requested changes.`
      : "No files have been uploaded yet. But you can generate code from scratch if the user asks.";

    const contents = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: `${fileContext}\n\nUSER INSTRUCTION:\n${newMessage}` }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          // @ts-expect-error - ignoring version mismatches for thinking level
          thinkingLevel: "HIGH"
        }
      }
    });

    const outputText = response.text || '';
    
    // Parse the updated files from the XML-like structure
    const updatedFiles = parseFilesFromOutput(outputText, files);
    if (updatedFiles.length > 0) {
      onUpdate(updatedFiles);
    }
    
    // We might not have raw thinking string in the base text if the SDK hides it or exposes it somewhere else. 
    // In newer genai sdk, thinking might be available in response.candidates[0].content.parts
    let thinkingText = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    const thinkingPart = parts.find(p => (p as any).thinking);
    if (thinkingPart) {
        thinkingText = (thinkingPart as any).thinking || '';
    }

    // Clean up the text to show to the user (remove the raw <files> blocks)
    const cleanedText = outputText.replace(/<files>[\s\S]*?<\/files>/gi, '*[Automated Update: Files have been updated based on the generated code]*');

    return { text: cleanedText, thinking: thinkingText };

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

function parseFilesFromOutput(output: string, currentFiles: VirtualFile[]): VirtualFile[] {
  const newFilesMap = new Map<string, string>();
  
  // Initialize with current files
  currentFiles.forEach(f => newFilesMap.set(f.path, f.content));

  const filesRegex = /<file\s+path="(.*?)">([\s\S]*?)<\/file>/gi;
  let match;
  let matchesFound = false;
  
  while ((match = filesRegex.exec(output)) !== null) {
    matchesFound = true;
    const filePath = match[1];
    const fileContent = match[2];
    newFilesMap.set(filePath, fileContent.trimStart());
  }

  if (matchesFound) {
    return Array.from(newFilesMap.entries()).map(([path, content]) => ({ path, content }));
  }
  return [];
}
