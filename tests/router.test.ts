import { describe, it, expect, beforeEach } from 'vitest';
import { ModelRouter, getDefaultModels } from '../src/router.js';

describe('ModelRouter', () => {
  let router: ModelRouter;

  beforeEach(() => {
    router = new ModelRouter();
  });

  describe('selectModel - cost strategy', () => {
    it('should select cheapest model for code_generation', () => {
      const result = router.selectModel('code_generation', 'cost');
      // deepseek-coder is cheapest at $0.0003/1k
      expect(result.cost).toBeLessThanOrEqual(0.001);
      expect(result.model).toBeDefined();
      expect(result.provider).toBeDefined();
    });

    it('should select cheapest model for qa', () => {
      const result = router.selectModel('qa', 'cost');
      expect(result.cost).toBeLessThanOrEqual(0.001);
    });
  });

  describe('selectModel - speed strategy', () => {
    it('should select fastest model', () => {
      const result = router.selectModel('qa', 'speed');
      // gemini-flash is fastest at 500ms
      expect(result.latency).toBeLessThanOrEqual(800);
    });

    it('should select low-latency model for chat', () => {
      const result = router.selectModel('chat', 'speed');
      expect(result.latency).toBeLessThanOrEqual(800);
    });
  });

  describe('selectModel - quality strategy', () => {
    it('should select highest quality model', () => {
      const result = router.selectModel('code_generation', 'quality');
      // claude-sonnet-4 has quality 4.9
      expect(result.quality).toBeGreaterThanOrEqual(4.5);
    });

    it('should select best model for creative_writing', () => {
      const result = router.selectModel('creative_writing', 'quality');
      expect(result.quality).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('selectModel - balanced strategy', () => {
    it('should return a valid model', () => {
      const result = router.selectModel('code_generation', 'balanced');
      expect(result.model).toBeDefined();
      expect(result.provider).toBeDefined();
      expect(result.cost).toBeGreaterThan(0);
      expect(result.latency).toBeGreaterThan(0);
      expect(result.quality).toBeGreaterThan(0);
    });

    it('should include reason in result', () => {
      const result = router.selectModel('qa', 'balanced');
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('task type routing', () => {
    const taskTypes = [
      'code_generation',
      'code_review',
      'qa',
      'translation',
      'creative_writing',
      'summarization',
      'data_analysis',
      'chat',
      'default'
    ];

    taskTypes.forEach(taskType => {
      it(`should return valid result for task type: ${taskType}`, () => {
        const result = router.selectModel(taskType, 'balanced');
        expect(result.model).toBeDefined();
        expect(result.provider).toBeDefined();
        expect(result.strategy).toBe('balanced');
      });
    });
  });

  describe('routing latency', () => {
    it('should make routing decision in under 10ms', () => {
      const start = Date.now();
      router.selectModel('code_generation', 'balanced');
      const latency = Date.now() - start;
      expect(latency).toBeLessThan(10);
    });

    it('should handle 100 concurrent routing decisions quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        router.selectModel('code_generation', 'cost');
      }
      const total = Date.now() - start;
      expect(total).toBeLessThan(100); // 100 decisions in under 100ms
    });
  });

  describe('getFallbackModel', () => {
    it('should return a different model as fallback', () => {
      const fallback = router.getFallbackModel('claude-sonnet-4', 'code_generation', 'balanced');
      expect(fallback).not.toBeNull();
      expect(fallback?.model).not.toBe('claude-sonnet-4');
    });

    it('should return null if all models are excluded', () => {
      const models = getDefaultModels();
      const singleModelRouter = new ModelRouter({ models: [models[0]] });
      const fallback = singleModelRouter.getFallbackModel(models[0].name, 'code_generation', 'balanced');
      expect(fallback).toBeNull();
    });
  });

  describe('custom models', () => {
    it('should use custom model configuration', () => {
      const customRouter = new ModelRouter({
        models: [
          { name: 'my-model', provider: 'custom', costPer1kTokens: 0.001, avgLatencyMs: 500, qualityScore: 4.0, enabled: true }
        ]
      });
      const result = customRouter.selectModel('code_generation', 'cost');
      expect(result.model).toBe('my-model');
      expect(result.provider).toBe('custom');
    });

    it('should skip disabled models', () => {
      const customRouter = new ModelRouter({
        models: [
          { name: 'disabled-model', provider: 'test', costPer1kTokens: 0.0001, avgLatencyMs: 100, qualityScore: 5.0, enabled: false },
          { name: 'active-model', provider: 'test', costPer1kTokens: 0.001, avgLatencyMs: 500, qualityScore: 4.0, enabled: true }
        ]
      });
      const result = customRouter.selectModel('code_generation', 'cost');
      expect(result.model).toBe('active-model');
    });
  });

  describe('error handling', () => {
    it('should throw error when no models available', () => {
      const emptyRouter = new ModelRouter({ models: [] });
      expect(() => emptyRouter.selectModel('code_generation', 'balanced')).toThrow('No available models configured');
    });
  });
});
