import { BaseComponent } from '../utils/base-component.js';
import { llmService } from '../services/llm-service.js';

/**
 * TemplateWizard Component
 * Modal for selecting and generating documents from templates
 */
export class TemplateWizard extends BaseComponent {
  constructor() {
    super();
    this.isOpen = false;
    this.templates = {
      prd: {
        name: 'Product Requirements Document',
        icon: '📋',
        sections: ['Overview', 'Goals', 'User Stories', 'Requirements', 'Success Metrics'],
      },
      blog: {
        name: 'Blog Post',
        icon: '✍️',
        sections: ['Introduction', 'Main Points', 'Conclusion', 'Call to Action'],
      },
      research: {
        name: 'Research Report',
        icon: '🔬',
        sections: ['Abstract', 'Introduction', 'Methodology', 'Results', 'Conclusion'],
      },
      architecture: {
        name: 'Architecture Design',
        icon: '🏗️',
        sections: ['Overview', 'Components', 'Data Flow', 'Technology Stack', 'Deployment'],
      },
      api: {
        name: 'API Documentation',
        icon: '🔌',
        sections: ['Overview', 'Authentication', 'Endpoints', 'Examples', 'Error Handling'],
      },
      proposal: {
        name: 'Business Proposal',
        icon: '📊',
        sections: ['Problem Statement', 'Proposed Solution', 'Benefits', 'Timeline', 'Budget'],
      },
      roadmap: {
        name: 'Product Roadmap',
        icon: '🗺️',
        sections: ['Vision', 'Q1 Goals', 'Q2 Goals', 'Q3 Goals', 'Q4 Goals', 'Future'],
      },
      tasks: {
        name: 'Task List',
        icon: '📝',
        sections: ['High Priority', 'Medium Priority', 'Low Priority', 'Backlog'],
      }
    };
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          background: rgba(0,0,0,0.5);
          justify-content: center;
          align-items: center;
        }

        :host(.show) {
          display: flex;
        }

        .wizard-container {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .wizard-header {
          padding: 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .wizard-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .wizard-content {
          padding: 24px;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .template-card {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .template-card:hover {
          border-color: #667eea;
          background: #f5f7ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .template-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .template-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .template-sections {
          font-size: 0.75rem;
          color: #666;
        }

        .generating {
          padding: 40px;
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .progress-text {
          color: #666;
          font-size: 0.9rem;
        }
      </style>

      <div class="wizard-container">
        <div class="wizard-header">
          <h2>📄 Generate Document</h2>
          <button class="close-btn" id="closeBtn">✕</button>
        </div>
        <div class="wizard-content" id="content">
          <p style="margin-bottom: 20px; color: #666;">Select a template to generate a document from your notes:</p>
          <div class="template-grid" id="templateGrid">
            <!-- Templates will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.$('#closeBtn')?.addEventListener('click', () => {
      this.close();
    });

    // Click outside to close
    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.close();
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderTemplates();
  }

  renderTemplates() {
    const grid = this.$('#templateGrid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(this.templates).forEach(([id, template]) => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-icon">${template.icon}</div>
        <div class="template-name">${template.name}</div>
        <div class="template-sections">${template.sections.length} sections</div>
      `;
      card.addEventListener('click', () => this.selectTemplate(id, template));
      grid.appendChild(card);
    });
  }

  async selectTemplate(id, template) {
    const content = this.$("#content");
    if (!content) return;

    // Get notes from parent app state
    const notes = window.stateManager.getState().notes;

    if (notes.length === 0) {
      alert(
        "No notes to generate document from. Please create some notes first."
      );
      this.close();
      return;
    }

    // Check if LLM is configured
    const llmConfig = llmService.config;
    const isLLMConfigured = this.checkLLMConfiguration(llmConfig);

    if (!isLLMConfigured) {
      // Show configuration prompt
      this.showLLMConfigPrompt(template);
      return;
    }

    // Show loading state
    content.innerHTML = `
      <div class="generating">
        <div class="spinner"></div>
        <div class="progress-text">Generating ${template.name}...</div>
      </div>
    `;

    try {
      // Format notes for LLM
      const notesText = notes
        .map((n) => {
          const title = n.title ? `**${n.title}**` : "";
          return `${title}\n${n.text}`;
        })
        .join("\n\n");

      // Create prompt based on template
      const prompt = this.createPrompt(template, notesText);

      // Generate document with timeout
      let document = "";
      let generationTimeout = setTimeout(() => {
        throw new Error(
          "Generation timeout - please check your LLM configuration"
        );
      }, 60000); // 60 second timeout

      try {
        for await (const chunk of llmService.generateStream(prompt, {
          temperature: 0.7,
          maxTokens: 2048,
        })) {
          document += chunk;
          // Update progress
          const progressText = content.querySelector(".progress-text");
          if (progressText) {
            progressText.textContent = `Generated ${document.length} characters...`;
          }
        }
        clearTimeout(generationTimeout);
      } catch (streamError) {
        clearTimeout(generationTimeout);
        throw streamError;
      }

      // Show result
      this.showResult(template.name, document);
    } catch (error) {
      console.error("Generation error:", error);

      // Show helpful error message based on error type
      let errorMessage = "Failed to generate document.";
      if (error.message.includes("not initialized")) {
        errorMessage +=
          "\n\n🔧 Please configure an LLM provider:\n1. Click Settings (⚙️) in top right\n2. Select a provider (WebLLM, OpenAI, etc.)\n3. Configure API key or load model\n4. Try templates again";
      } else if (error.message.includes("timeout")) {
        errorMessage +=
          "\n\n⏰ Generation took too long. Try:\n1. Using a smaller/faster model\n2. Reducing the number of notes\n3. Checking your internet connection";
      } else {
        errorMessage += `\n\n❌ Error: ${error.message}\n\nPlease check your LLM configuration in Settings.`;
      }

      this.showError(errorMessage);
    }
  }

  createPrompt(template, notesText) {
    return `Create a professional ${template.name} based on these notes:

${notesText}

Structure the document with these sections:
${template.sections.map(s => `- ${s}`).join('\n')}

Make it comprehensive, well-structured, and professional. Use markdown formatting.`;
  }

  showResult(templateName, document) {
    const content = this.$('#content');
    if (!content) return;

    content.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px 0;">✅ Document Generated!</h3>
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <button id="downloadBtn" style="flex: 1; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            📥 Download Markdown
          </button>
          <button id="copyBtn" style="flex: 1; padding: 12px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            📋 Copy to Clipboard
          </button>
        </div>
        <div style="max-height: 400px; overflow-y: auto; background: #f5f5f5; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap;">${document}</div>
      </div>
    `;

    this.$('#downloadBtn')?.addEventListener('click', () => {
      const blob = new Blob([document], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    this.$('#copyBtn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(document);
        alert('Copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy to clipboard');
      }
    });
  }

  open() {
    this.classList.add('show');
    this.isOpen = true;
    this.renderTemplates(); // Refresh templates
  }

  close() {
    this.classList.remove('show');
    this.isOpen = false;
  }

  checkLLMConfiguration(config) {
    if (!config || !config.provider) {
      return false;
    }

    switch (config.provider) {
      case 'webllm':
        return config.isLoaded === true;
      case 'openai':
      case 'anthropic':
      case 'groq':
        return config.apiKey && config.apiKey.length > 0;
      case 'ollama':
        return config.endpoint && config.model;
      default:
        return false;
    }
  }

  showLLMConfigPrompt(template) {
    const content = this.$('#content');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🤖</div>
        <h3 style="margin: 0 0 16px 0; color: #333;">LLM Not Configured</h3>
        <p style="color: #666; margin-bottom: 24px; line-height: 1.5;">
          To generate a <strong>${template.name}</strong>, you need to configure an AI language model first.
        </p>
        <div style="background: #f8f9ff; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: left;">
          <h4 style="margin: 0 0 12px 0; color: #667eea;">Quick Setup Options:</h4>
          <div style="margin-bottom: 12px;">🌐 <strong>WebLLM</strong> - Free, runs in browser (no API key needed)</div>
          <div style="margin-bottom: 12px;">🚀 <strong>OpenAI</strong> - Fast, requires API key</div>
          <div style="margin-bottom: 12px;">🏠 <strong>Ollama</strong> - Local server, privacy-focused</div>
          <div>🔥 <strong>Groq</strong> - Ultra-fast inference</div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="openSettingsBtn" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            ⚙️ Open Settings
          </button>
          <button id="backBtn" style="padding: 12px 24px; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            ← Back to Templates
          </button>
        </div>
      </div>
    `;

    this.$('#openSettingsBtn')?.addEventListener('click', () => {
      this.close();
      // Trigger settings opening
      const event = new CustomEvent('open-settings');
      document.dispatchEvent(event);
    });

    this.$('#backBtn')?.addEventListener('click', () => {
      this.renderTemplates();
    });
  }

  showError(message) {
    const content = this.$('#content');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h3 style="margin: 0 0 16px 0; color: #d32f2f;">Generation Failed</h3>
        <div style="background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: left; white-space: pre-line; color: #333;">
          ${message}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="tryAgainBtn" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            🔄 Try Again
          </button>
          <button id="backBtn" style="padding: 12px 24px; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">
            ← Back to Templates
          </button>
        </div>
      </div>
    `;

    this.$('#tryAgainBtn')?.addEventListener('click', () => {
      this.renderTemplates();
    });

    this.$('#backBtn')?.addEventListener('click', () => {
      this.renderTemplates();
    });
  }
}

customElements.define('template-wizard', TemplateWizard);
