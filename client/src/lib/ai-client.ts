import { apiRequest } from './queryClient';

export type AIModel = 
  // OpenAI models
  | 'gpt-4-turbo-preview'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  // Llama/Groq models
  | 'llama-3.1-sonar-small-128k-online'
  | 'llama-3.1-sonar-large-128k-online'
  | 'llama-3.1-sonar-huge-128k-online'
  // Gemini models
  | 'gemini-pro'
  | 'gemini-pro-vision'
  // Claude models
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  // DeepSeek models
  | 'deepseek-chat'
  | 'deepseek-coder';

export interface ModelProvider {
  name: string;
  models: AIModel[];
  requiresApiKey: boolean;
}

export const modelProviders: ModelProvider[] = [
  {
    name: 'OpenAI',
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  {
    name: 'Groq',
    models: [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online'
    ],
    requiresApiKey: true
  },
  {
    name: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision'],
    requiresApiKey: false // Using environment variable
  },
  {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    requiresApiKey: true
  },
  {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    requiresApiKey: true
  }
];

export type ContentType = 'blog' | 'facebook' | 'script';

export async function generateContent(prompt: string, model: AIModel) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to generate content');
  }

  return response.json();
}

export function getProviderForModel(model: AIModel): ModelProvider {
  return modelProviders.find(provider => 
    provider.models.includes(model)
  )!;
}