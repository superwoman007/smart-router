// src/router.ts
export interface Model {
  name: string;
  provider: string;
  costPer1kTokens: number;
  avgLatencyMs: number;
  qualityScore: number;
  enabled?: boolean;
}

export interface RoutingResult {
  model: string;
  provider: string;
  reason: string;
  cost: number;
  latency: number;
  quality: number;
  strategy: string;
}

// Task type to preferred models mapping
const TASK_MODEL_MAP: Record<string, string[]> = {
  code_generation: ['claude-sonnet-4', 'gpt-4o', 'deepseek-coder'],
  code_review: ['claude-sonnet-4', 'gpt-4o'],
  qa: ['gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
  translation: ['gpt-4o-mini', 'claude-haiku'],
  creative_writing: ['claude-sonnet-4', 'gpt-4o'],
  summarization: ['gpt-4o-mini', 'claude-haiku'],
  data_analysis: ['gpt-4o', 'claude-sonnet-4'],
  chat: ['gpt-4o-mini', 'claude-haiku', 'gemini-flash'],
  default: ['gpt-4o-mini', 'claude-haiku']
};

// Default model configurations
export function getDefaultModels(): Model[] {
  return [
    { name: 'gpt-4o', provider: 'openai', costPer1kTokens: 0.005, avgLatencyMs: 1500, qualityScore: 4.8, enabled: true },
    { name: 'gpt-4o-mini', provider: 'openai', costPer1kTokens: 0.0005, avgLatencyMs: 800, qualityScore: 4.2, enabled: true },
    { name: 'claude-sonnet-4', provider: 'anthropic', costPer1kTokens: 0.003, avgLatencyMs: 1200, qualityScore: 4.9, enabled: true },
    { name: 'claude-haiku', provider: 'anthropic', costPer1kTokens: 0.0008, avgLatencyMs: 600, qualityScore: 4.0, enabled: true },
    { name: 'gemini-pro', provider: 'google', costPer1kTokens: 0.001, avgLatencyMs: 1000, qualityScore: 4.3, enabled: true },
    { name: 'gemini-flash', provider: 'google', costPer1kTokens: 0.0002, avgLatencyMs: 500, qualityScore: 3.8, enabled: true },
    { name: 'deepseek-coder', provider: 'deepseek', costPer1kTokens: 0.0003, avgLatencyMs: 900, qualityScore: 4.5, enabled: true }
  ];
}

export class ModelRouter {
  private models: Model[];
  private taskRules: Record<string, string[]>;

  constructor(config: any = {}) {
    this.models = config.models || getDefaultModels();
    this.taskRules = config.taskRules || TASK_MODEL_MAP;
  }

  /**
   * Select the best model based on task type and strategy
   */
  selectModel(
    taskType: string,
    strategy: string = 'balanced',
    customRules?: Record<string, string[]>
  ): RoutingResult {
    const rules = customRules || this.taskRules;
    const availableModels = this.models.filter(m => m.enabled !== false);

    if (availableModels.length === 0) {
      throw new Error('No available models configured');
    }

    // Get preferred models for this task type
    const preferredModelNames = rules[taskType] || rules['default'];
    let candidateModels = availableModels.filter(m => 
      preferredModelNames.includes(m.name)
    );

    // Fallback to all models if no matches
    if (candidateModels.length === 0) {
      candidateModels = availableModels;
    }

    // Sort by strategy
    let sortedModels: Model[];
    switch (strategy) {
      case 'cost':
        sortedModels = candidateModels.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
        break;
      case 'speed':
        sortedModels = candidateModels.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
        break;
      case 'quality':
        sortedModels = candidateModels.sort((a, b) => b.qualityScore - a.qualityScore);
        break;
      case 'balanced':
        // Balanced: normalize and combine all factors
        sortedModels = this.balancedSort(candidateModels);
        break;
      default:
        sortedModels = candidateModels;
    }

    const selected = sortedModels[0];

    return {
      model: selected.name,
      provider: selected.provider,
      reason: this.generateReason(taskType, strategy, selected),
      cost: selected.costPer1kTokens,
      latency: selected.avgLatencyMs,
      quality: selected.qualityScore,
      strategy
    };
  }

  /**
   * Balanced sorting: normalize and combine cost, speed, quality
   */
  private balancedSort(models: Model[]): Model[] {
    // Normalize each metric to 0-1 range
    const costs = models.map(m => m.costPer1kTokens);
    const latencies = models.map(m => m.avgLatencyMs);
    const qualities = models.map(m => m.qualityScore);

    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const minQuality = Math.min(...qualities);
    const maxQuality = Math.max(...qualities);

    const scored = models.map(m => {
      // Lower cost is better (invert)
      const costScore = maxCost > minCost ? 1 - (m.costPer1kTokens - minCost) / (maxCost - minCost) : 1;
      // Lower latency is better (invert)
      const speedScore = maxLatency > minLatency ? 1 - (m.avgLatencyMs - minLatency) / (maxLatency - minLatency) : 1;
      // Higher quality is better
      const qualityScore = maxQuality > minQuality ? (m.qualityScore - minQuality) / (maxQuality - minQuality) : 1;

      // Weighted average: quality 40%, cost 30%, speed 30%
      const totalScore = qualityScore * 0.4 + costScore * 0.3 + speedScore * 0.3;

      return { model: m, score: totalScore };
    });

    return scored.sort((a, b) => b.score - a.score).map(s => s.model);
  }

  /**
   * Generate human-readable reason for model selection
   */
  private generateReason(taskType: string, strategy: string, model: Model): string {
    const reasons: Record<string, string> = {
      cost: `Most cost-effective for ${taskType} ($${model.costPer1kTokens}/1k tokens)`,
      speed: `Fastest response for ${taskType} (~${model.avgLatencyMs}ms)`,
      quality: `Highest quality for ${taskType} (${model.qualityScore}/5.0)`,
      balanced: `Best overall balance for ${taskType} (quality ${model.qualityScore}/5.0, cost $${model.costPer1kTokens}/1k)`
    };

    return reasons[strategy] || `Selected ${model.name} for ${taskType}`;
  }

  /**
   * Get fallback model if primary fails
   */
  getFallbackModel(primaryModel: string, taskType: string, strategy: string): RoutingResult | null {
    const availableModels = this.models.filter(m => 
      m.enabled !== false && m.name !== primaryModel
    );

    if (availableModels.length === 0) {
      return null;
    }

    // Create temporary router without the failed model
    const tempRouter = new ModelRouter({
      models: availableModels,
      taskRules: this.taskRules
    });

    return tempRouter.selectModel(taskType, strategy);
  }
}
