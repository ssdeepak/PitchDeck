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
    const content = this.$('#content');
    if (!content) return;

    // Show loading state
    content.innerHTML = `
      <div class="generating">
        <div class="spinner"></div>
        <div class="progress-text">Generating ${template.name}...</div>
      </div>
    `;

    try {
      // Get notes from parent app state
      const notes = window.stateManager.getState().notes;
      
      if (notes.length === 0) {
        alert('No notes to generate document from. Please create some notes first.');
        this.close();
        return;
      }

      // Format notes for LLM
      const notesText = notes.map(n => {
        const title = n.title ? `**${n.title}**` : '';
        return `${title}\n${n.text}`;
      }).join('\n\n');

      // Create prompt based on template
      const prompt = this.createPrompt(template, notesText);

      // Generate document
      let document = '';
      for await (const chunk of llmService.generateStream(prompt, { temperature: 0.7, maxTokens: 2048 })) {
        document += chunk;
        // Update progress
        const progressText = content.querySelector('.progress-text');
        if (progressText) {
          progressText.textContent = `Generated ${document.length} characters...`;
        }
      }

      // Show result
      this.showResult(template.name, document);

    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate document: ${error.message}\n\nPlease configure an LLM provider in Settings.`);
      this.close();
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
}

customElements.define('template-wizard', TemplateWizard);
