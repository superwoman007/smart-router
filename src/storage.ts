// src/storage.ts - Routing log storage using SQLite
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface RoutingLog {
  id?: number;
  taskType: string;
  selectedModel: string;
  provider: string;
  strategy: string;
  latencyMs?: number;
  tokensUsed?: number;
  cost?: number;
  success: boolean;
  errorMessage?: string;
  createdAt?: string;
}

export interface RoutingStats {
  totalCalls: number;
  totalCost: number;
  avgLatencyMs: number;
  successRate: number;
  modelUsage: Record<string, number>;
  strategyUsage: Record<string, number>;
  taskTypeUsage: Record<string, number>;
}

let db: any = null;

export function initStorage(dataDir: string): void {
  try {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = join(dataDir, 'smart-model-router.db');
    
    // Try to load better-sqlite3, but don't fail if not available
    try {
      const Database = require('better-sqlite3');
      db = new Database(dbPath);
    } catch (err) {
      console.warn('[smart-model-router] better-sqlite3 not available, storage disabled');
      db = null;
      return;
    }

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS routing_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL,
        selected_model TEXT NOT NULL,
        provider TEXT NOT NULL,
        strategy TEXT NOT NULL,
        latency_ms INTEGER DEFAULT 0,
        tokens_used INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        success INTEGER DEFAULT 1,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_routing_logs_created_at ON routing_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_routing_logs_model ON routing_logs(selected_model);
      CREATE INDEX IF NOT EXISTS idx_routing_logs_task ON routing_logs(task_type);
    `);
  } catch (err) {
    // Storage is optional - plugin works without it
    console.warn('[smart-model-router] Storage initialization failed (non-critical):', err);
    db = null;
  }
}

export function logRouting(log: RoutingLog): void {
  if (!db) return;

  try {
    db.prepare(`
      INSERT INTO routing_logs 
      (task_type, selected_model, provider, strategy, latency_ms, tokens_used, cost, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.taskType,
      log.selectedModel,
      log.provider,
      log.strategy,
      log.latencyMs || 0,
      log.tokensUsed || 0,
      log.cost || 0,
      log.success ? 1 : 0,
      log.errorMessage || null
    );
  } catch (err) {
    console.warn('[smart-model-router] Failed to log routing:', err);
  }
}

export function getStats(days: number = 30): RoutingStats {
  if (!db) {
    return {
      totalCalls: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      successRate: 1,
      modelUsage: {},
      strategyUsage: {},
      taskTypeUsage: {}
    };
  }

  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(cost), 0) as total_cost,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        COALESCE(AVG(success), 1) as success_rate
      FROM routing_logs WHERE created_at > ?
    `).get(cutoff);

    const modelUsageRows = db.prepare(`
      SELECT selected_model, COUNT(*) as count
      FROM routing_logs WHERE created_at > ?
      GROUP BY selected_model
    `).all(cutoff);

    const strategyUsageRows = db.prepare(`
      SELECT strategy, COUNT(*) as count
      FROM routing_logs WHERE created_at > ?
      GROUP BY strategy
    `).all(cutoff);

    const taskTypeUsageRows = db.prepare(`
      SELECT task_type, COUNT(*) as count
      FROM routing_logs WHERE created_at > ?
      GROUP BY task_type
    `).all(cutoff);

    return {
      totalCalls: summary?.total || 0,
      totalCost: summary?.total_cost || 0,
      avgLatencyMs: Math.round(summary?.avg_latency || 0),
      successRate: summary?.success_rate || 1,
      modelUsage: Object.fromEntries(modelUsageRows.map((r: any) => [r.selected_model, r.count])),
      strategyUsage: Object.fromEntries(strategyUsageRows.map((r: any) => [r.strategy, r.count])),
      taskTypeUsage: Object.fromEntries(taskTypeUsageRows.map((r: any) => [r.task_type, r.count]))
    };
  } catch (err) {
    console.warn('[smart-model-router] Failed to get stats:', err);
    return {
      totalCalls: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      successRate: 1,
      modelUsage: {},
      strategyUsage: {},
      taskTypeUsage: {}
    };
  }
}

export function getRecentLogs(limit: number = 50): RoutingLog[] {
  if (!db) return [];

  try {
    return db.prepare(`
      SELECT * FROM routing_logs ORDER BY created_at DESC LIMIT ?
    `).all(limit).map((row: any) => ({
      id: row.id,
      taskType: row.task_type,
      selectedModel: row.selected_model,
      provider: row.provider,
      strategy: row.strategy,
      latencyMs: row.latency_ms,
      tokensUsed: row.tokens_used,
      cost: row.cost,
      success: row.success === 1,
      errorMessage: row.error_message,
      createdAt: row.created_at
    }));
  } catch (err) {
    return [];
  }
}
