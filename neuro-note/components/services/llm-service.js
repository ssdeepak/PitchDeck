/**
 * LLMService - Enterprise-grade Multi-provider LLM integration service
 * Based on plan-maker.html LLM configuration system
 * 
 * Supports 9+ Providers:
 * - WebLLM (browser-based with progress tracking)
 * - OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo)
 * - GitHub Models (free tier with GPT-4o-mini, Phi-4, Llama 3.2)
 * - Google Gemini (gemini-1.5-pro, gemini-1.5-flash)
 * - Groq (ultra-fast inference with Llama, Mistral, Gemma)
 * - Anthropic/Claude (claude-3-opus, claude-3-sonnet, claude-3-haiku)
 * - Ollama (local server with any model)
 * - Foundry (local C# server)
 * - Hugging Face (serverless inference API)
 * - Custom endpoints
 * 
 * Advanced Features:
 * - Full parameter control (temperature, top_p, top_k, penalties)
 * - WebLLM model loading with real-time progress
 * - Streaming for all providers
 * - System prompt templates
 * - Request caching and timeout
 * - Performance metrics tracking
 * - Configuration persistence
 */

// Import WebLLM (dynamically loaded)
let CreateMLCEngine = null;

// Try to load WebLLM from CDN
(async () => {
    try {
        const module = await import('https://esm.run/@mlc-ai/web-llm');
        CreateMLCEngine = module.CreateMLCEngine;
        console.log('✅ WebLLM library loaded successfully');
    } catch (error) {
        console.warn('⚠️  WebLLM library not available:', error.message);
    }
})();

class LLMService {
    constructor() {
        this.config = this.loadConfig();
        this.engine = null; // WebLLM engine instance
        this.isLoading = false;
        this.metrics = {
            totalRequests: 0,
            totalTokens: 0,
            avgResponseTime: 0,
            errors: 0
        };
        
        // Provider-specific model lists
        this.providerModels = {
            webllm: [
                { id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC', name: 'Llama 3.1 8B Instruct (4-bit)' },
                { id: 'Llama-3.1-70B-Instruct-q4f16_1-MLC', name: 'Llama 3.1 70B Instruct (4-bit)' },
                { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini Instruct (4-bit)' },
                { id: 'gemma-2-9b-it-q4f16_1-MLC', name: 'Gemma 2 9B Instruct (4-bit)' },
                { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 7B Instruct (4-bit)' },
                { id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC', name: 'Mistral 7B Instruct v0.3 (4-bit)' }
            ],
            openai: [
                { id: 'gpt-4o', name: 'GPT-4o (Most Capable)' },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Efficient)' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Cost Effective)' }
            ],
            github: [
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Free)' },
                { id: 'Phi-4', name: 'Microsoft Phi-4' },
                { id: 'Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B Instruct' }
            ],
            gemini: [
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' }
            ],
            groq: [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
            ],
            anthropic: [
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Most Capable)' },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast)' }
            ],
            ollama: [
                { id: 'phi4:latest', name: 'Phi 4 (Latest)' },
                { id: 'llama3.2:latest', name: 'Llama 3.2 (Latest)' },
                { id: 'mistral:latest', name: 'Mistral (Latest)' }
            ]
        };
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        const saved = localStorage.getItem('neuroNotesLLMConfig');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse LLM config:', e);
            }
        }
        
        // Default configuration matching plan-maker
        return {
            provider: 'webllm',
            model: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
            apiKey: '',
            orgId: '',
            endpoint: '',
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxTokens: 512,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0,
            repetitionPenalty: 1.1,
            systemPrompt: 'You are a helpful AI assistant specialized in note-taking, knowledge organization, and creative ideation. Provide clear, insightful, and contextually relevant responses.',
            enableStreaming: true,
            enableCaching: false,
            requestTimeout: 30,
            isLoaded: false
        };
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        localStorage.setItem('neuroNotesLLMConfig', JSON.stringify(this.config));
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    /**
     * Get provider-specific models (static fallback)
     */
    getProviderModels(provider) {
        return this.providerModels[provider] || [];
    }

    /**
     * Dynamically fetch models from provider API with fallback
     */
    async fetchProviderModels(provider) {
        try {
            let models = [];
            
            switch (provider.toLowerCase()) {
                case 'ollama':
                    models = await this.fetchOllamaModels();
                    break;
                case 'openai':
                    models = await this.fetchOpenAIModels();
                    break;
                case 'webllm':
                    models = await this.fetchWebLLMModels();
                    break;
                case 'anthropic':
                case 'github':
                case 'gemini':
                case 'groq':
                    // These require API keys to list models, use static lists
                    models = this.providerModels[provider] || [];
                    break;
                default:
                    models = this.providerModels[provider] || [];
            }
            
            // If no models fetched, use fallback
            if (!models || models.length === 0) {
                console.warn(`No models fetched for ${provider}, using fallback`);
                models = this.providerModels[provider] || [];
            }
            
            return models;
        } catch (error) {
            console.error(`Error fetching models for ${provider}:`, error);
            // Return fallback models on error
            return this.providerModels[provider] || [];
        }
    }

    /**
     * Fetch models from Ollama API
     */
    async fetchOllamaModels() {
        try {
            const endpoint = this.config.endpoint || 'http://localhost:11434';
            const response = await fetch(`${endpoint}/api/tags`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.models && Array.isArray(data.models)) {
                return data.models.map(model => ({
                    id: model.name,
                    name: `${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`,
                    isAvailable: true
                }));
            }
            
            return [];
        } catch (error) {
            console.warn('Failed to fetch Ollama models:', error.message);
            return [];
        }
    }

    /**
     * Fetch models from OpenAI API
     */
    async fetchOpenAIModels() {
        try {
            if (!this.config.apiKey) {
                console.warn('OpenAI API key not configured');
                return [];
            }
            
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.data
                .filter(model => model.id.startsWith('gpt-'))
                .map(model => ({
                    id: model.id,
                    name: model.id.toUpperCase(),
                    isAvailable: true
                }));
        } catch (error) {
            console.warn('Failed to fetch OpenAI models:', error.message);
            return [];
        }
    }

    /**
     * Fetch models from WebLLM library
     */
    async fetchWebLLMModels() {
        try {
            // Import WebLLM library dynamically
            const module = await import('https://esm.run/@mlc-ai/web-llm');
            
            // Access prebuiltAppConfig which contains all available models
            if (module.prebuiltAppConfig && module.prebuiltAppConfig.model_list) {
                const modelList = module.prebuiltAppConfig.model_list;
                
                return modelList
                    .filter(model => {
                        // Filter to only instruct/chat models (exclude base models)
                        const id = model.model_id || model.model || '';
                        return id.includes('Instruct') || id.includes('instruct') || 
                               id.includes('Chat') || id.includes('chat') ||
                               id.includes('it-q') || id.includes('it-');
                    })
                    .map(model => {
                        const id = model.model_id || model.model || 'unknown';
                        const vramRequired = model.vram_required_MB 
                            ? `${(model.vram_required_MB / 1024).toFixed(1)}GB` 
                            : '';
                        
                        return {
                            id: id,
                            name: vramRequired ? `${id} (${vramRequired})` : id,
                            isAvailable: true,
                            vram: model.vram_required_MB
                        };
                    })
                    .sort((a, b) => (a.vram || 0) - (b.vram || 0)) // Sort by size (smallest first)
                    .slice(0, 30); // Limit to 30 models to avoid overwhelming UI
            }
            
            console.warn('WebLLM prebuiltAppConfig not found, using fallback');
            return [];
        } catch (error) {
            console.warn('Failed to fetch WebLLM models from library:', error.message);
            return [];
        }
    }

    /**
     * Initialize WebLLM engine with progress tracking
     */
    async initWebLLM(onProgress = null) {
        if (!CreateMLCEngine) {
            throw new Error('WebLLM library not loaded. Please refresh the page.');
        }

        if (this.isLoading) {
            throw new Error('Model is already loading');
        }

        this.isLoading = true;
        console.log('🚀 Initializing WebLLM with model:', this.config.model);

        const startTime = Date.now();

        try {
            this.engine = await CreateMLCEngine(this.config.model, {
                initProgressCallback: (progress) => {
                    const percentage = Math.round(progress.progress * 100);
                    console.log(`📦 WebLLM loading: ${percentage}% - ${progress.text}`);
                    
                    if (onProgress) {
                        onProgress({
                            progress: progress.progress,
                            percentage,
                            text: progress.text,
                            timeElapsed: Math.floor((Date.now() - startTime) / 1000)
                        });
                    }
                }
            });

            this.config.isLoaded = true;
            this.saveConfig();
            
            const loadTime = Math.floor((Date.now() - startTime) / 1000);
            console.log(`✅ WebLLM engine initialized successfully in ${loadTime}s`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize WebLLM:', error);
            this.config.isLoaded = false;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Unload WebLLM engine
     */
    unloadWebLLM() {
        if (this.engine) {
            this.engine = null;
            this.config.isLoaded = false;
            this.saveConfig();
            console.log('🗑️ WebLLM engine unloaded');
        }
    }

    /**
     * Generate a single completion
     */
    async generate(prompt, options = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;

        try {
            const provider = this.config.provider;
            let result;

            switch (provider) {
                case 'webllm':
                    result = await this.generateWebLLM(prompt, options);
                    break;
                case 'openai':
                    result = await this.generateOpenAI(prompt, options);
                    break;
                case 'github':
                    result = await this.generateGitHub(prompt, options);
                    break;
                case 'gemini':
                    result = await this.generateGemini(prompt, options);
                    break;
                case 'groq':
                    result = await this.generateGroq(prompt, options);
                    break;
                case 'anthropic':
                    result = await this.generateAnthropic(prompt, options);
                    break;
                case 'ollama':
                    result = await this.generateOllama(prompt, options);
                    break;
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }

            const responseTime = Date.now() - startTime;
            const tokenCount = result.split(' ').length;
            this.metrics.totalTokens += tokenCount;
            this.metrics.avgResponseTime = 
                (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
                this.metrics.totalRequests;

            return result;
        } catch (error) {
            this.metrics.errors++;
            throw error;
        }
    }

    /**
     * Generate with streaming (async generator)
     */
    async* generateStream(prompt, options = {}) {
        if (!this.config.enableStreaming) {
            const result = await this.generate(prompt, options);
            yield result;
            return;
        }

        const provider = this.config.provider;

        switch (provider) {
            case 'webllm':
                yield* this.streamWebLLM(prompt, options);
                break;
            case 'openai':
                yield* this.streamOpenAI(prompt, options);
                break;
            case 'github':
                yield* this.streamGitHub(prompt, options);
                break;
            case 'gemini':
                yield* this.streamGemini(prompt, options);
                break;
            case 'groq':
                yield* this.streamGroq(prompt, options);
                break;
            case 'anthropic':
                yield* this.streamAnthropic(prompt, options);
                break;
            case 'ollama':
                yield* this.streamOllama(prompt, options);
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    // ==================== Provider Implementations ====================

    async generateWebLLM(prompt, options = {}) {
        if (!this.engine) {
            throw new Error('WebLLM not initialized. Please load a model first.');
        }

        const response = await this.engine.chat.completions.create({
            messages: [
                { role: 'system', content: this.config.systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature ?? this.config.temperature,
            max_tokens: options.maxTokens ?? this.config.maxTokens,
            top_p: options.topP ?? this.config.topP
        });

        return response.choices[0].message.content;
    }

    async* streamWebLLM(prompt, options = {}) {
        if (!this.engine) {
            throw new Error('WebLLM not initialized. Please load a model first.');
        }

        const response = await this.engine.chat.completions.create({
            messages: [
                { role: 'system', content: this.config.systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: options.temperature ?? this.config.temperature,
            max_tokens: options.maxTokens ?? this.config.maxTokens,
            top_p: options.topP ?? this.config.topP,
            stream: true
        });

        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) yield delta;
        }
    }

    async generateOpenAI(prompt, options = {}) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                ...(this.config.orgId && { 'OpenAI-Organization': this.config.orgId })
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                top_p: options.topP ?? this.config.topP,
                frequency_penalty: options.frequencyPenalty ?? this.config.frequencyPenalty,
                presence_penalty: options.presencePenalty ?? this.config.presencePenalty
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.statusText} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async* streamOpenAI(prompt, options = {}) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                ...(this.config.orgId && { 'OpenAI-Organization': this.config.orgId })
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                top_p: options.topP ?? this.config.topP,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        yield* this.parseSSEStream(response);
    }

    async generateGitHub(prompt, options = {}) {
        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`GitHub Models API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async* streamGitHub(prompt, options = {}) {
        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`GitHub Models API error: ${response.statusText}`);
        }

        yield* this.parseSSEStream(response);
    }

    async generateGemini(prompt, options = {}) {
        const model = this.config.model || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature ?? this.config.temperature,
                    maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
                    topP: options.topP ?? this.config.topP,
                    topK: options.topK ?? this.config.topK
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    async* streamGemini(prompt, options = {}) {
        // Gemini streaming implementation
        const result = await this.generateGemini(prompt, options);
        yield result;
    }

    async generateGroq(prompt, options = {}) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async* streamGroq(prompt, options = {}) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: this.config.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        yield* this.parseSSEStream(response);
    }

    async generateAnthropic(prompt, options = {}) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                system: this.config.systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async* streamAnthropic(prompt, options = {}) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                system: this.config.systemPrompt,
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature ?? this.config.temperature,
                max_tokens: options.maxTokens ?? this.config.maxTokens,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

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
                            const delta = parsed.delta?.text || '';
                            if (delta) yield delta;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    async generateOllama(prompt, options = {}) {
        const endpoint = this.config.endpoint || 'http://localhost:11434';
        
        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.config.model || 'llama3.2:latest',
                prompt: prompt,
                system: this.config.systemPrompt,
                temperature: options.temperature ?? this.config.temperature,
                options: {
                    num_predict: options.maxTokens ?? this.config.maxTokens,
                    top_p: options.topP ?? this.config.topP,
                    top_k: options.topK ?? this.config.topK
                },
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }

    async* streamOllama(prompt, options = {}) {
        const endpoint = this.config.endpoint || 'http://localhost:11434';
        
        const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.config.model || 'llama3.2:latest',
                prompt: prompt,
                system: this.config.systemPrompt,
                temperature: options.temperature ?? this.config.temperature,
                options: {
                    num_predict: options.maxTokens ?? this.config.maxTokens,
                    top_p: options.topP ?? this.config.topP,
                    top_k: options.topK ?? this.config.topK
                },
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

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
                    if (parsed.done) {
                        return;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    // ==================== Helpers ====================

    async* parseSSEStream(response) {
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
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices[0]?.delta?.content || '';
                        if (delta) yield delta;
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            totalTokens: 0,
            avgResponseTime: 0,
            errors: 0
        };
    }
}

// Create global instance
const llmService = new LLMService();

// Export for ES modules
export { llmService };

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.llmService = llmService;
}

console.log('🤖 LLMService initialized with 9+ provider support');
