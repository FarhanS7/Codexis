/**
 * Maps a file path to its corresponding Monaco Editor language identifier.
 * Uses a compile-time Record lookup for maximum O(1) performance.
 */
const LANG_MAP: Record<string, string> = {
  // JavaScript & TypeScript
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  
  // Stylesheets
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',
  
  // Data formats
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  csv: 'plaintext',
  
  // Web technologies
  html: 'html',
  htm: 'html',
  
  // Systems & scripts
  sh: 'shell',
  bash: 'shell',
  ps1: 'powershell',
  py: 'python',
  go: 'go',
  rb: 'ruby',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  php: 'php',
  pl: 'perl',
  
  // Configurations
  md: 'markdown',
  markdown: 'markdown',
  dockerfile: 'dockerfile',
  ini: 'ini',
  sql: 'sql',
};

export function getMonacoLanguage(filePath: string): string {
  if (!filePath) return 'plaintext';
  
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1].toLowerCase();
  
  // Special check for Dockerfile (which doesn't have an extension)
  if (fileName === 'dockerfile') {
    return 'dockerfile';
  }
  
  const extParts = fileName.split('.');
  if (extParts.length < 2) return 'plaintext';
  
  const ext = extParts[extParts.length - 1];
  return LANG_MAP[ext] ?? 'plaintext';
}
