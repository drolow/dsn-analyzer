/// <reference types="vite/client" />

// Import de fichiers DSN bruts via la syntaxe Vite "?raw".
declare module '*.dsn?raw' {
  const content: string;
  export default content;
}
