#!/usr/bin/env node
/**
 * Start Ollama with CORS allowed for the Angular dev server.
 * Resolves ollama.exe on Windows when it's not in PATH (e.g. %LOCALAPPDATA%\Programs\Ollama).
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

process.env.OLLAMA_ORIGINS = process.env.OLLAMA_ORIGINS || 'http://localhost:4200';

function findOllama() {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const exe = path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return 'ollama';
}

const ollamaBin = findOllama();
const child = spawn(ollamaBin, ['serve'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error(
      '[start-ollama] Ollama not found. Install from https://ollama.com or run "npm run start:app" to skip Ollama.'
    );
  } else {
    console.error('[start-ollama]', err.message);
  }
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
