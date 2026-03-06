// index.ts - Plugin entry point
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { registerSmartRouterTools } from "./src/tools.js";
import { initStorage, getStats, getRecentLogs } from "./src/storage.js";
import { join } from "path";
import { homedir } from "os";

const plugin = {
  id: "smart-model-router",
  name: "Smart Model Router",
  description: "Intelligently route AI requests to optimal models based on task type, cost, speed, and quality",

  async register(api: OpenClawPluginApi) {
    // Initialize storage (async)
    const dataDir = join(homedir(), '.openclaw', 'data');
    await initStorage(dataDir);

    // Register agent tools
    registerSmartRouterTools(api);

    // Register CLI commands
    api.registerCli(({ program }) => {
      const cmd = program
        .command('smart-router')
        .description('Smart Model Router commands');

      cmd
        .command('stats')
        .option('-d, --days <days>', 'Number of days to analyze', '30')
        .description('Show routing statistics')
        .action(async (options) => {
          const stats = getStats(parseInt(options.days));
          
          console.log('\n📊 Smart Model Router Statistics\n');
          console.log(`Total Calls: ${stats.totalCalls}`);
          console.log(`Total Cost: $${stats.totalCost.toFixed(4)}`);
          console.log(`Avg Latency: ${stats.avgLatencyMs}ms`);
          console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
          
          if (Object.keys(stats.modelUsage).length > 0) {
            console.log('\nModel Usage:');
            Object.entries(stats.modelUsage)
              .sort(([, a], [, b]) => b - a)
              .forEach(([model, count]) => {
                const pct = ((count / stats.totalCalls) * 100).toFixed(1);
                console.log(`  ${model}: ${count} (${pct}%)`);
              });
          }

          if (Object.keys(stats.strategyUsage).length > 0) {
            console.log('\nStrategy Usage:');
            Object.entries(stats.strategyUsage)
              .sort(([, a], [, b]) => b - a)
              .forEach(([strategy, count]) => {
                const pct = ((count / stats.totalCalls) * 100).toFixed(1);
                console.log(`  ${strategy}: ${count} (${pct}%)`);
              });
          }

          if (Object.keys(stats.taskTypeUsage).length > 0) {
            console.log('\nTask Type Usage:');
            Object.entries(stats.taskTypeUsage)
              .sort(([, a], [, b]) => b - a)
              .forEach(([task, count]) => {
                const pct = ((count / stats.totalCalls) * 100).toFixed(1);
                console.log(`  ${task}: ${count} (${pct}%)`);
              });
          }
        });

      cmd
        .command('logs')
        .option('-n, --limit <limit>', 'Number of logs to show', '20')
        .description('Show recent routing logs')
        .action(async (options) => {
          const logs = getRecentLogs(parseInt(options.limit));
          
          if (logs.length === 0) {
            console.log('No routing logs found.');
            return;
          }

          console.log('\n📝 Recent Routing Logs\n');
          logs.forEach(log => {
            const status = log.success ? '✅' : '❌';
            console.log(`${status} [${log.createdAt}] ${log.taskType} → ${log.selectedModel} (${log.strategy})`);
            if (!log.success && log.errorMessage) {
              console.log(`   Error: ${log.errorMessage}`);
            }
          });
        });

      cmd
        .command('test')
        .option('-t, --task <type>', 'Task type', 'code_generation')
        .option('-s, --strategy <strategy>', 'Strategy', 'balanced')
        .description('Test routing decision')
        .action(async (options) => {
          const { ModelRouter } = await import('./src/router.js');
          const config = api.config.plugins?.entries?.['smart-model-router']?.config || {};
          const router = new ModelRouter(config);

          console.log(`\n🧪 Testing routing for task: ${options.task}, strategy: ${options.strategy}\n`);
          
          const result = router.selectModel(options.task, options.strategy);
          
          console.log(`Selected Model: ${result.model}`);
          console.log(`Provider: ${result.provider}`);
          console.log(`Reason: ${result.reason}`);
          console.log(`Cost: $${result.cost}/1k tokens`);
          console.log(`Latency: ~${result.latency}ms`);
          console.log(`Quality: ${result.quality}/5.0`);
        });
    }, { commands: ['smart-router'] });

    api.logger.info('Smart Model Router plugin loaded successfully');
  }
};

export default plugin;
