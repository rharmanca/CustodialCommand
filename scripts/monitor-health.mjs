#!/usr/bin/env node
/**
 * Simple health monitoring script for Custodial Command
 * Run with: node scripts/monitor-health.mjs
 * 
 * Options:
 *   --watch      Continuously monitor every 60 seconds
 *   --interval=N Set interval to N seconds (default: 60)
 */

const PROD_URL = 'https://cacustodialcommand.up.railway.app';

async function checkHealth() {
  const timestamp = new Date().toLocaleString();
  
  try {
    const start = Date.now();
    const response = await fetch(`${PROD_URL}/health`, {
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    
    if (!response.ok) {
      console.log(`[${timestamp}] ERROR: HTTP ${response.status}`);
      return null;
    }
    
    const health = await response.json();
    
    // Format output
    const uptimeHours = (health.uptime / 3600).toFixed(2);
    const memMB = health.memory.used;
    const memTotal = health.memory.total;
    const memPct = health.memory.percentage;
    const dbStatus = health.database === 'connected' ? '✓' : '✗';
    
    // Note: memory.percentage is heap usage (used/total heap), not container memory
    // Heap grows dynamically, so high % is normal. Container limit is 5GB.
    console.log(`[${timestamp}] Status: ${health.status.toUpperCase()} | Uptime: ${uptimeHours}h | Heap: ${memMB}MB/${memTotal}MB | DB: ${dbStatus} | Latency: ${latency}ms`);
    
    // Warnings - only warn if heap is very large (indicating potential leak)
    if (memMB > 500) {
      console.log(`  ⚠️  HIGH HEAP WARNING: ${memMB}MB - possible memory leak`);
    }
    if (health.status !== 'ok') {
      console.log(`  ⚠️  HEALTH STATUS: ${health.status}`);
    }
    
    return health;
  } catch (error) {
    console.log(`[${timestamp}] FAILED: ${error.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  const intervalArg = args.find(a => a.startsWith('--interval='));
  const intervalSec = intervalArg ? parseInt(intervalArg.split('=')[1]) : 60;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Custodial Command Health Monitor');
  console.log(`  URL: ${PROD_URL}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (watchMode) {
    console.log(`  Mode: Watching every ${intervalSec} seconds (Ctrl+C to stop)\n`);
    
    // Initial check
    await checkHealth();
    
    // Continuous monitoring
    setInterval(checkHealth, intervalSec * 1000);
  } else {
    console.log('  Mode: Single check (use --watch for continuous)\n');
    await checkHealth();
    console.log('\nTip: Run with --watch to monitor continuously');
  }
}

main();
