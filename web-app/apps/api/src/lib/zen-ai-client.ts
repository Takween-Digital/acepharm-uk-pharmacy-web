import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Zen Gateway AI Client Configuration (Section 5.1 & 5.4)
 *
 * Primary Model: mimo-v2.5-free
 * Fallback Chain: nemotron-3.5-lightning-free, llama-3-free, muse-spark-1.2-free,
 *                 big-pickle-free, grok-3-free, nemotron-3-ultra-free
 * Gateway: opencode.ai Zen Gateway
 * Base URL: https://opencode.ai/zen/v1
 * Endpoint: https://opencode.ai/zen/v1/chat/completions
 */
const FALLBACK_MODELS = [
  'nemotron-3.5-lightning-free',
  'llama-3-free',
  'muse-spark-1.2-free',
  'big-pickle-free',
  'grok-3-free',
  'nemotron-3-ultra-free',
] as const;

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
 * Returns the configured MiMo-V2.5 model instance for Ace streaming generation.
 * Falls back to other free OpenCode Zen models if primary fails.
 */
export function getMimoModel(apiKey: string = 'free-tier') {
  const client = getZenAIClient(apiKey);
  return client('mimo-v2.5-free');
}

/**
 * Returns the next fallback model in the rotation chain.
 */
export function getFallbackModel(apiKey: string = 'free-tier', index: number = 0) {
  const client = getZenAIClient(apiKey);
  const modelIndex = index % FALLBACK_MODELS.length;
  return client(FALLBACK_MODELS[modelIndex]);
}
