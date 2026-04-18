import JSZip from 'jszip';
import { VirtualFile } from '../types';

export const extractZip = async (file: File): Promise<VirtualFile[]> => {
  const zip = await JSZip.loadAsync(file);
  const files: VirtualFile[] = [];

  const promises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      // Focus on text-based files for now, filter out common binary ones implicitly 
      // by simply attempting to read as text. If we wanted to be more robust, 
      // we'd check extensions.
      const isLikelyBinary = relativePath.match(/\\.(png|jpe?g|gif|ico|pdf|zip|tar|gz|mp4|webm)$/i);
      
      if (!isLikelyBinary) {
        const promise = zipEntry.async('string').then((content) => {
          files.push({
            path: relativePath,
            content,
          });
        });
        promises.push(promise);
      }
    }
  });

  await Promise.all(promises);
  return files;
};

export const createZip = async (files: VirtualFile[]): Promise<Blob> => {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  return await zip.generateAsync({ type: 'blob' });
};

export const downloadZip = async (files: VirtualFile[], filename: string = 'application_export.zip') => {
  const blob = await createZip(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
