// src/tools.ts - Agent tool registration
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { ModelRouter } from "./router.js";
import { logRouting } from "./storage.js";

export function registerSmartRouterTools(api: OpenClawPluginApi) {
  const config = api.config.plugins?.entries?.['smart-model-router']?.config || {};
  const router = new ModelRouter(config);

  // Main routing tool
  api.registerTool({
    name: "smart_model_router",
    description: "Intelligently select the best AI model based on task type and routing strategy. Returns recommended model with cost/latency/quality estimates.",
    parameters: {
      type: "object",
      properties: {
        task_type: {
          type: "string",
          enum: [
            "code_generation",
            "code_review",
            "qa",
            "translation",
            "creative_writing",
            "summarization",
            "data_analysis",
            "chat",
            "default"
          ],
          description: "Type of task to perform"
        },
        strategy: {
          type: "string",
          enum: ["cost", "speed", "quality", "balanced"],
          description: "Routing strategy: cost (cheapest), speed (fastest), quality (best output), balanced (smart mix)"
        },
        prompt: {
          type: "string",
          description: "Optional: the prompt text for additional context"
        }
      },
      required: ["task_type"]
    },
    handler: async (params: any) => {
      const { task_type, strategy = config.defaultStrategy || 'balanced', prompt } = params;
      
      try {
        const startTime = Date.now();
        const result = router.selectModel(task_type, strategy);
        const latency = Date.now() - startTime;

        // Log routing decision
        if (config.enableLogging !== false) {
          logRouting({
            taskType: task_type,
            selectedModel: result.model,
            provider: result.provider,
            strategy: result.strategy,
            latencyMs: latency,
            success: true
          });
        }

        return {
          selected_model: result.model,
          provider: result.provider,
          reason: result.reason,
          estimated_cost_per_1k_tokens: result.cost,
          estimated_latency_ms: result.latency,
          quality_score: result.quality,
          strategy: result.strategy,
          routing_latency_ms: latency
        };
      } catch (error: any) {
        // Log failure
        if (config.enableLogging !== false) {
          logRouting({
            taskType: task_type,
            selectedModel: 'unknown',
            provider: 'unknown',
            strategy: strategy || 'balanced',
            success: false,
            errorMessage: error.message
          });
        }

        throw error;
      }
    }
  });

  // Fallback tool (for when primary model fails)
  api.registerTool({
    name: "smart_model_fallback",
    description: "Get a fallback model when the primary model fails. Automatically excludes the failed model.",
    parameters: {
      type: "object",
      properties: {
        failed_model: {
          type: "string",
          description: "The model that failed"
        },
        task_type: {
          type: "string",
          description: "Type of task"
        },
        strategy: {
          type: "string",
          enum: ["cost", "speed", "quality", "balanced"],
          description: "Routing strategy"
        }
      },
      required: ["failed_model", "task_type"]
    },
    handler: async (params: any) => {
      const { failed_model, task_type, strategy = config.defaultStrategy || 'balanced' } = params;

      if (!config.enableFallback) {
        throw new Error('Fallback is disabled in configuration');
      }

      const fallback = router.getFallbackModel(failed_model, task_type, strategy);

      if (!fallback) {
        throw new Error('No fallback model available');
      }

      // Log fallback
      if (config.enableLogging !== false) {
        logRouting({
          taskType: task_type,
          selectedModel: fallback.model,
          provider: fallback.provider,
          strategy: fallback.strategy,
          success: true
        });
      }

      return {
        fallback_model: fallback.model,
        provider: fallback.provider,
        reason: `Fallback after ${failed_model} failed: ${fallback.reason}`,
        estimated_cost_per_1k_tokens: fallback.cost,
        estimated_latency_ms: fallback.latency,
        quality_score: fallback.quality
      };
    }
  });
}
