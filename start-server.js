#!/usr/bin/env node

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      for (const pid of pids) {
        console.log(`Killing process ${pid} on port ${port}`);
        await execAsync(`kill -9 ${pid}`);
      }
      // Wait a moment for the port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    // No process found on port, which is fine
    console.log(`No process found on port ${port}`);
  }
}

async function startServer() {
  const port = process.env.PORT || 5000;
  
  console.log('🚀 Starting Custodial Command Server...');
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Kill any existing process on the port
  await killProcessOnPort(port);
  
  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port }
  });
  
  server.on('error', (error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
  });
}

startServer().catch(console.error);
