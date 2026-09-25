import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Automatic model discovery cache (in production, store in KV)
const discoveredModels = new Set<string>();
let lastModelDiscoveryTime = 0;
const MODEL_DISCOVERY_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

/**
 * Zen Gateway AI Client Configuration (Section 5.1 & 5.4)
 *
 * Primary Model: grok-3-free (highest token allocation)
 * Fallback Chain (token-aware rotation): mimo-v2.5-free, nemotron-3.5-lightning-free,
 *                                        llama-3-free, muse-spark-1.2-free,
 *                                        big-pickle-free, nemotron-3-ultra-free
 *
 * Smart Fallback: System detects token exhaustion via rate-limit responses and
 * automatically switches to the next available model. When all tokens are consumed,
 * rotation cycles back to the beginning.
 *
 * Gateway: opencode.ai Zen Gateway
 * Base URL: https://opencode.ai/zen/v1
 * Endpoint: https://opencode.ai/zen/v1/chat/completions
 */

// Primary model with highest token allocation
const PRIMARY_MODEL = 'grok-3-free';

// Fallback models in priority order (ranked by available tokens)
const FALLBACK_MODELS = [
  'mimo-v2.5-free',
  'nemotron-3.5-lightning-free',
  'llama-3-free',
  'muse-spark-1.2-free',
  'big-pickle-free',
  'nemotron-3-ultra-free',
] as const;

// In-memory model state tracker (in production, move to KV cache)
interface ModelState {
  modelName: string;
  isExhausted: boolean;
  lastErrorTime: number;
  consecutiveFailures: number;
}

const modelStateMap = new Map<string, ModelState>();

// Initialize model state
function initializeModelState() {
  modelStateMap.set(PRIMARY_MODEL, {
    modelName: PRIMARY_MODEL,
    isExhausted: false,
    lastErrorTime: 0,
    consecutiveFailures: 0,
  });
  FALLBACK_MODELS.forEach((model) => {
    modelStateMap.set(model, {
      modelName: model,
      isExhausted: false,
      lastErrorTime: 0,
      consecutiveFailures: 0,
    });
  });
}

initializeModelState();

/**
 * Checks if a model has recovered from token exhaustion (5-minute recovery window)
 */
function hasModelRecovered(state: ModelState): boolean {
  const RECOVERY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  return Date.now() - state.lastErrorTime > RECOVERY_WINDOW_MS;
}

/**
 * Marks a model as token exhausted
 */
export function markModelExhausted(modelName: string) {
  const state = modelStateMap.get(modelName);
  if (state) {
    state.isExhausted = true;
    state.lastErrorTime = Date.now();
    state.consecutiveFailures += 1;
    console.warn(`[AI-Gateway] Model exhausted: ${modelName} (failures: ${state.consecutiveFailures})`);
  }
}

/**
 * Resets model error state when successfully used
 */
export function resetModelState(modelName: string) {
  const state = modelStateMap.get(modelName);
  if (state) {
    state.isExhausted = false;
    state.consecutiveFailures = 0;
  }
}

/**
 * Gets the next available model based on token availability
 * Prioritizes: primary → hardcoded fallbacks → discovered models → primary (retry)
 */
export function getNextAvailableModel(previousModel?: string): string {
  // Try primary model first if recovered
  const primaryState = modelStateMap.get(PRIMARY_MODEL);
  if (primaryState && (!primaryState.isExhausted || hasModelRecovered(primaryState))) {
    primaryState.isExhausted = false;
    return PRIMARY_MODEL;
  }

  // Try fallback models in order
  for (const model of FALLBACK_MODELS) {
    const state = modelStateMap.get(model);
    if (state && (!state.isExhausted || hasModelRecovered(state))) {
      state.isExhausted = false;
      if (model !== previousModel) {
        console.info(`[AI-Gateway] Switched to model: ${model}`);
      }
      return model;
    }
  }

  // Try newly discovered models
  for (const model of discoveredModels) {
    const state = modelStateMap.get(model);
    if (state && (!state.isExhausted || hasModelRecovered(state))) {
      state.isExhausted = false;
      if (model !== previousModel) {
        console.info(`[AI-Gateway] Switched to newly discovered model: ${model}`);
      }
      return model;
    }
  }

  // All models exhausted, return primary (will trigger error handling upstream)
  console.error('[AI-Gateway] All models exhausted, using primary model');
  return PRIMARY_MODEL;
}

export function getZenAIClient(apiKey: string = 'free-tier') {
  return createOpenAICompatible({
    name: 'opencode-zen',
    baseURL: 'https://opencode.ai/zen/v1',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

/**
 * Returns the optimal model instance for Ace streaming generation.
 * Implements token-aware fallback: starts with grok-3-free, falls back to other
 * models when tokens are exhausted, with automatic recovery after 5 minutes.
 */
export function getOptimalModel(apiKey: string = 'free-tier', previousModel?: string) {
  const client = getZenAIClient(apiKey);
  const optimalModel = getNextAvailableModel(previousModel);
  return client(optimalModel);
}

/**
 * Legacy function - redirects to primary model (grok-3-free)
 */
export function getMimoModel(apiKey: string = 'free-tier') {
  const client = getZenAIClient(apiKey);
  return client(PRIMARY_MODEL);
}

/**
 * Returns a specific fallback model by index
 */
export function getFallbackModel(apiKey: string = 'free-tier', index: number = 0) {
  const client = getZenAIClient(apiKey);
  const modelIndex = index % FALLBACK_MODELS.length;
  return client(FALLBACK_MODELS[modelIndex]);
}

/**
 * Gets all available models with their current state
 */
export function getModelStates() {
  return Array.from(modelStateMap.values()).map((state) => ({
    model: state.modelName,
    isExhausted: state.isExhausted,
    consecutiveFailures: state.consecutiveFailures,
    canRecover: state.isExhausted && hasModelRecovered(state),
  }));
}

/**
 * Automatically discovers new free models from OpenCode Zen Gateway
 * Runs periodically (every hour) to check for newly available models
 */
export async function discoverNewModels(apiKey: string = 'free-tier'): Promise<string[]> {
  const now = Date.now();

  // Skip if we've discovered models recently
  if (now - lastModelDiscoveryTime < MODEL_DISCOVERY_INTERVAL_MS) {
    return Array.from(discoveredModels);
  }

  try {
    // Attempt to fetch model list from OpenCode Zen API
    const response = await fetch('https://opencode.ai/zen/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      const models = data?.data || [];

      // Filter for free models (contain "-free" in name)
      const freeModels = models
        .map((m: any) => m.id || m.name)
        .filter((name: string) => typeof name === 'string' && name.includes('-free'));

      // Add newly discovered models to the state map
      for (const model of freeModels) {
        if (!modelStateMap.has(model)) {
          modelStateMap.set(model, {
            modelName: model,
            isExhausted: false,
            lastErrorTime: 0,
            consecutiveFailures: 0,
          });
          discoveredModels.add(model);
          console.info(`[AI-Gateway] Discovered new free model: ${model}`);
        }
      }
    }
  } catch (err) {
    console.warn('[AI-Gateway] Model discovery failed (non-blocking):', err);
  }

  lastModelDiscoveryTime = now;
  return Array.from(discoveredModels);
}

/**
 * Gets all currently available models (hardcoded + discovered)
 */
export function getAllAvailableModels(): string[] {
  const all = new Set<string>();
  all.add(PRIMARY_MODEL);
  FALLBACK_MODELS.forEach((m) => all.add(m));
  discoveredModels.forEach((m) => all.add(m));
  return Array.from(all);
}
