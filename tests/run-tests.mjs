// Simple test runner - no dependencies needed
import { ModelRouter, getDefaultModels } from '../src/router.ts';

// Use dynamic import for TS support
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function expect(val) {
  return {
    toBe: (expected) => {
      if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`);
    },
    toBeGreaterThan: (n) => {
      if (!(val > n)) throw new Error(`Expected ${val} > ${n}`);
    },
    toBeLessThan: (n) => {
      if (!(val < n)) throw new Error(`Expected ${val} < ${n}`);
    },
    toBeLessThanOrEqual: (n) => {
      if (!(val <= n)) throw new Error(`Expected ${val} <= ${n}`);
    },
    toBeGreaterThanOrEqual: (n) => {
      if (!(val >= n)) throw new Error(`Expected ${val} >= ${n}`);
    },
    toBeDefined: () => {
      if (val === undefined || val === null) throw new Error(`Expected defined value, got ${val}`);
    },
    toBeTruthy: () => {
      if (!val) throw new Error(`Expected truthy, got ${val}`);
    },
    not: {
      toBe: (expected) => {
        if (val === expected) throw new Error(`Expected not ${expected}`);
      },
      toBeNull: () => {
        if (val === null) throw new Error(`Expected not null`);
      }
    },
    toThrow: () => {} // handled differently
  };
}

const router = new ModelRouter();

console.log('\n🧪 Smart Model Router - Unit Tests\n');

// Cost strategy tests
test('cost strategy selects cheapest model for code_generation', () => {
  const result = router.selectModel('code_generation', 'cost');
  expect(result.cost).toBeLessThanOrEqual(0.001);
  expect(result.model).toBeDefined();
});

test('cost strategy selects cheapest model for qa', () => {
  const result = router.selectModel('qa', 'cost');
  expect(result.cost).toBeLessThanOrEqual(0.001);
});

// Speed strategy tests
test('speed strategy selects fastest model for qa', () => {
  const result = router.selectModel('qa', 'speed');
  expect(result.latency).toBeLessThanOrEqual(800);
});

test('speed strategy selects fast model for chat', () => {
  const result = router.selectModel('chat', 'speed');
  expect(result.latency).toBeLessThanOrEqual(800);
});

// Quality strategy tests
test('quality strategy selects highest quality model', () => {
  const result = router.selectModel('code_generation', 'quality');
  expect(result.quality).toBeGreaterThanOrEqual(4.5);
});

// Balanced strategy tests
test('balanced strategy returns valid model', () => {
  const result = router.selectModel('code_generation', 'balanced');
  expect(result.model).toBeDefined();
  expect(result.provider).toBeDefined();
  expect(result.cost).toBeGreaterThan(0);
});

test('balanced strategy includes reason', () => {
  const result = router.selectModel('qa', 'balanced');
  expect(result.reason).toBeTruthy();
});

// Task types
const taskTypes = ['code_generation', 'code_review', 'qa', 'translation', 'creative_writing', 'chat', 'default'];
taskTypes.forEach(task => {
  test(`handles task type: ${task}`, () => {
    const result = router.selectModel(task, 'balanced');
    expect(result.model).toBeDefined();
    expect(result.strategy).toBe('balanced');
  });
});

// Performance test
test('routing decision under 10ms', () => {
  const start = Date.now();
  router.selectModel('code_generation', 'balanced');
  const latency = Date.now() - start;
  expect(latency).toBeLessThan(10);
});

test('100 routing decisions under 100ms', () => {
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    router.selectModel('code_generation', 'cost');
  }
  expect(Date.now() - start).toBeLessThan(100);
});

// Fallback test
test('getFallbackModel returns different model', () => {
  const fallback = router.getFallbackModel('claude-sonnet-4', 'code_generation', 'balanced');
  if (fallback) expect(fallback.model).not.toBe('claude-sonnet-4');
});

// Custom models
test('custom disabled models are skipped', () => {
  const custom = new ModelRouter({
    models: [
      { name: 'disabled', provider: 'test', costPer1kTokens: 0.0001, avgLatencyMs: 100, qualityScore: 5.0, enabled: false },
      { name: 'active', provider: 'test', costPer1kTokens: 0.001, avgLatencyMs: 500, qualityScore: 4.0, enabled: true }
    ]
  });
  const result = custom.selectModel('code_generation', 'cost');
  expect(result.model).toBe('active');
});

// Error handling
test('throws when no models available', () => {
  const empty = new ModelRouter({ models: [] });
  try {
    empty.selectModel('code_generation', 'balanced');
    failed++;
    console.log('❌ throws when no models available: should have thrown');
  } catch (e) {
    if (e.message.includes('No available models')) {
      console.log('✅ throws when no models available');
      passed++;
    } else {
      throw e;
    }
  }
  // Remove the auto-count since we manually counted
  passed--;
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  process.exit(1);
}
