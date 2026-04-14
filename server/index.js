#!/usr/bin/env node
/**
 * Smart Money Tracker — API Server
 * Runs Python scrapers and serves data to the React frontend.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCRIPTS_DIR = join(ROOT, 'scripts');
const DATA_DIR = join(ROOT, 'src', 'data');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────

function runPython(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const proc = spawn('python3', [join(SCRIPTS_DIR, scriptName), ...args], {
      cwd: SCRIPTS_DIR,
      env: { ...process.env, PYTHONIOENCODING: 'utf8' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => (stdout += d.toString()));
    proc.stderr.on('data', d => (stderr += d.toString()));

    proc.on('close', code => {
      const elapsed = Date.now() - start;
      if (code === 0) {
        try {
          const result = stdout.trim() ? JSON.parse(stdout.trim()) : { success: true, output: stdout.trim() };
          resolve({ success: true, elapsed, data: result, stdout: stdout.trim() });
        } catch {
          resolve({ success: true, elapsed, data: null, stdout: stdout.trim() });
        }
      } else {
        reject(new Error(`Script exited with code ${code}: ${stderr || stdout}`));
      }
    });

    proc.on('error', err => reject(err));
  });
}

function loadDataSources() {
  const metaPath = join(DATA_DIR, 'datasource_meta.json');
  if (existsSync(metaPath)) {
    try { return JSON.parse(readFileSync(metaPath, 'utf8')); } catch { /* ignore */ }
  }
  return null;
}

function saveDataSources(meta) {
  const metaPath = join(DATA_DIR, 'datasource_meta.json');
  const { writeFileSync } = require('fs');
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/sources — list all data sources with metadata
app.get('/api/sources', async (req, res) => {
  try {
    const meta = loadDataSources();
    const sources = [
      {
        id: 'sec_edgar',
        source: 'SEC_EDGAR',
        name: 'SEC EDGAR 13F',
        nameEn: 'SEC EDGAR 13F (US Institutions)',
        description: '美国证监会 13F 机构持仓披露（季度，45天内延迟）',
        coverage: '美国主要对冲基金 & 资管机构',
        updateFreq: '季度披露（Q1-Q4）',
        lastUpdated: meta?.sec_edgar?.lastUpdated || '2026-02-14',
        recordCount: meta?.sec_edgar?.recordCount || 0,
        freshness: 'stale',
        color: '#38bdf8',
        isRealData: true,
        status: 'ready',
        docs: 'https://www.sec.gov/edgar',
      },
      {
        id: 'hkex',
        source: 'HKEX',
        name: '港交所披露易',
        nameEn: 'HKEX Disclosure e-Knowledge',
        description: '港交所substantial shareholding 重要股东披露（每日更新）',
        coverage: '港交所上市主要股票外资持仓',
        updateFreq: '每日更新',
        lastUpdated: meta?.hkex?.lastUpdated || '2026-04-11',
        recordCount: meta?.hkex?.recordCount || 0,
        freshness: 'recent',
        color: '#f59e0b',
        isRealData: true,
        status: 'ready',
        docs: 'https://www.hkex.com.hk/eng/investing/securities/eqacc/',
      },
      {
        id: 'eastmoney_qfii',
        source: 'EASTMONEY_QFII',
        name: '东方财富 QFII',
        nameEn: 'Eastmoney QFII Holdings',
        description: '东方财富QFII持股数据（覆盖所有QFII机构 A股持仓）',
        coverage: 'QFII 机构 A股持仓',
        updateFreq: '每日更新',
        lastUpdated: meta?.eastmoney_qfii?.lastUpdated || '2026-04-14',
        recordCount: meta?.eastmoney_qfii?.recordCount || 0,
        freshness: 'live',
        color: '#22c55e',
        isRealData: true,
        status: 'ready',
        docs: 'https://data.eastmoney.com/qfii/',
      },
      {
        id: 'tushare_hsgt',
        source: 'TUSHARE_HSGT',
        name: 'Tushare 沪深港通',
        nameEn: 'Tushare HSGT (Southbound + Northbound)',
        description: 'Tushare 沪深港通持股明细（南向+北向资金持仓）',
        coverage: '沪深港通标的证券持仓',
        updateFreq: '每日更新',
        lastUpdated: meta?.tushare_hsgt?.lastUpdated || '2026-04-14',
        recordCount: meta?.tushare_hsgt?.recordCount || 0,
        freshness: 'live',
        color: '#a78bfa',
        isRealData: true,
        status: 'ready',
        docs: 'https://tushare.pro/',
      },
      {
        id: 'mock',
        source: 'MOCK',
        name: '演示数据',
        nameEn: 'Mock / Demo Data',
        description: '用于演示的模拟数据（非真实市场数据）',
        coverage: '所有市场（模拟）',
        updateFreq: '手动',
        lastUpdated: '2026-04-14',
        recordCount: 67,
        freshness: 'stale',
        color: '#ef4444',
        isRealData: false,
        status: 'ready',
        docs: '',
      },
    ];

    // Attach live freshness calculation
    const now = Date.now();
    const withFreshness = sources.map(s => {
      const lastUpdatedDate = new Date(s.lastUpdated);
      const diffDays = (now - lastUpdatedDate.getTime()) / 86400000;
      let freshness = 'stale';
      if (diffDays <= 3) freshness = 'live';
      else if (diffDays <= 30) freshness = 'recent';
      return { ...s, freshness };
    });

    res.json({ success: true, sources: withFreshness });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/refresh/:sourceId — trigger scraper for a specific source
app.post('/api/refresh/:sourceId', async (req, res) => {
  const { sourceId } = req.params;

  const SCRIPTER_MAP = {
    sec_edgar: 'sec_13f_scraper.py',
    hkex: 'hkex_scraper.py',
    eastmoney_qfii: 'eastmoney_scraper.py',
    tushare_hsgt: 'eastmoney_scraper.py', // uses same scraper with different args
    mock: null,
  };

  const script = SCRIPTER_MAP[sourceId];
  if (!script) {
    return res.status(404).json({ success: false, error: `Unknown source: ${sourceId}` });
  }

  try {
    const result = await runPython(script);
    const now = new Date().toISOString().split('T')[0];

    // Update metadata
    const meta = loadDataSources() || {};
    meta[sourceId] = {
      lastUpdated: now,
      lastRefreshedAt: new Date().toISOString(),
      recordCount: result.data?.records?.length || result.data?.length || 0,
      elapsed: result.elapsed,
    };

    // Write meta
    const { writeFileSync } = await import('fs');
    writeFileSync(join(DATA_DIR, 'datasource_meta.json'), JSON.stringify(meta, null, 2));

    res.json({
      success: true,
      sourceId,
      lastUpdated: now,
      recordCount: meta[sourceId].recordCount,
      elapsed: result.elapsed,
      output: result.stdout?.slice(0, 500),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sourceId });
  }
});

// POST /api/refresh/all — trigger all scrapers + merge
app.post('/api/refresh/all', async (req, res) => {
  const results = {};
  const sources = ['sec_edgar', 'hkex', 'eastmoney_qfii'];

  for (const src of sources) {
    const SCRIPTER_MAP = {
      sec_edgar: 'sec_13f_scraper.py',
      hkex: 'hkex_scraper.py',
      eastmoney_qfii: 'eastmoney_scraper.py',
    };
    try {
      const result = await runPython(SCRIPTER_MAP[src]);
      results[src] = { success: true, elapsed: result.elapsed };
    } catch (err) {
      results[src] = { success: false, error: err.message };
    }
  }

  // Run merge
  try {
    await runPython('merge_data.py');
    results['merge'] = { success: true };
  } catch (err) {
    results['merge'] = { success: false, error: err.message };
  }

  const now = new Date().toISOString();

  res.json({
    success: true,
    finishedAt: now,
    results,
  });
});

// GET /api/holdings — return current holdings data
app.get('/api/holdings', (req, res) => {
  try {
    res.json({ success: true, source: 'realData', note: 'Data served from src/data/realData.ts' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend in production
const distPath = join(ROOT, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Smart Money API Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  /api/sources         — List all data sources`);
  console.log(`   POST /api/refresh/:id     — Refresh a specific source`);
  console.log(`   POST /api/refresh/all     — Refresh all sources`);
  console.log(`   GET  /api/holdings        — Get holdings data`);
});
