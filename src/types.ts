export interface VirtualFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  thinking?: string;
}
