/**
 * LLM Service
 * Handles integration with various LLM providers (WebLLM, OpenAI, Anthropic, Ollama)
 */

import { CreateWebWorkerMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';

class LLMService {
  constructor() {
    this.engine = null;
    this.config = {
      provider: 'webllm', // 'webllm', 'openai', 'anthropic', 'ollama'
      model: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      apiKey: '',
      endpoint: '',
      temperature: 0.7,
      maxTokens: 512,
      isLoaded: false
    };
    
    // Provider-specific model lists (like plan-maker)
    this.providerModels = {
      webllm: [
        'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
        'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
        'Phi-3.5-mini-instruct-q4f16_1-MLC',
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        'gemma-2-2b-it-q4f16_1-MLC'
      ],
      openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ],
      anthropic: [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      ollama: [
        'llama3.2',
        'llama3.2:1b',
        'llama3.2:3b',
        'phi4',
        'phi3',
        'mistral',
        'qwen2.5',
        'gemma2'
      ]
    };
    
    this.loadConfig();
  }

  /**
   * Load saved configuration from localStorage
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('neuroNote_llmConfig');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load LLM config:', e);
    }
  }

  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem('neuroNote_llmConfig', JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save LLM config:', e);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  /**
   * Get available models for a provider
   * Returns array of model names with fallback
   */
  getProviderModels(provider) {
    return this.providerModels[provider] || [];
  }

  /**
   * Initialize WebLLM engine
   */
  async initWebLLM(progressCallback) {
    try {
      const workerScript = `
        import { WebWorkerMLCEngineHandler } from "https://esm.run/@mlc-ai/web-llm";
        const handler = new WebWorkerMLCEngineHandler();
        self.onmessage = msg => handler.onmessage(msg);
      `;
      
      const blob = new Blob([workerScript], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl, { type: "module" });

      this.engine = await CreateWebWorkerMLCEngine(
        worker,
        this.config.model,
        { 
          initProgressCallback: (p) => {
            if (progressCallback) {
              progressCallback(p);
            }
          }
        }
      );

      this.config.isLoaded = true;
      this.saveConfig();
      
      return true;
    } catch (err) {
      console.error('WebLLM init error:', err);
      return false;
    }
  }

  /**
   * Generate completion using configured provider
   */
  async generate(prompt, options = {}) {
    const { temperature = this.config.temperature, maxTokens = this.config.maxTokens } = options;

    if (this.config.provider === 'webllm') {
      return this.generateWebLLM(prompt, { temperature, maxTokens });
    } else if (this.config.provider === 'openai') {
      return this.generateOpenAI(prompt, { temperature, maxTokens });
    } else if (this.config.provider === 'anthropic') {
      return this.generateAnthropic(prompt, { temperature, maxTokens });
    } else if (this.config.provider === 'ollama') {
      return this.generateOllama(prompt, { temperature, maxTokens });
    }

    throw new Error(`Unknown provider: ${this.config.provider}`);
  }

  /**
   * Generate using WebLLM (browser-based)
   */
  async generateWebLLM(prompt, options = {}) {
    if (!this.engine || !this.config.isLoaded) {
      throw new Error('WebLLM not initialized. Please load a model first.');
    }

    try {
      const response = await this.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 512
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('WebLLM generation error:', error);
      throw error;
    }
  }

  /**
   * Generate using OpenAI API
   */
  async generateOpenAI(prompt, options = {}) {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 512
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate using Anthropic API
   */
  async generateAnthropic(prompt, options = {}) {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 512
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0]?.text || '';
    } catch (error) {
      console.error('Anthropic generation error:', error);
      throw error;
    }
  }

  /**
   * Generate using Ollama (local)
   */
  async generateOllama(prompt, options = {}) {
    const endpoint = this.config.endpoint || 'http://localhost:11434';

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'llama2',
          prompt: prompt,
          temperature: options.temperature || 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  /**
   * Stream completion (for document generation)
   */
  async* generateStream(prompt, options = {}) {
    if (this.config.provider === 'webllm') {
      // WebLLM doesn't support streaming yet, fallback to regular generation
      const result = await this.generateWebLLM(prompt, options);
      yield result;
    } else if (this.config.provider === 'openai') {
      yield* this.streamOpenAI(prompt, options);
    } else if (this.config.provider === 'anthropic') {
      yield* this.streamAnthropic(prompt, options);
    } else if (this.config.provider === 'ollama') {
      yield* this.streamOllama(prompt, options);
    }
  }

  /**
   * Stream from OpenAI
   */
  async* streamOpenAI(prompt, options = {}) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Stream from Anthropic
   */
  async* streamAnthropic(prompt, options = {}) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text;
              if (content) {
                yield content;
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Stream from Ollama
   */
  async* streamOllama(prompt, options = {}) {
    const endpoint = this.config.endpoint || 'http://localhost:11434';

    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        prompt: prompt,
        temperature: options.temperature || 0.7,
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            yield parsed.response;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
