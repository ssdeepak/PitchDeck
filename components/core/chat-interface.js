import { BaseComponent } from '../utils/base-component.js';
import { llmService } from '../services/llm-service.js';
import { stateManager } from '../services/state-manager.js';

/**
 * ChatInterface Component
 * Draggable chat interface that can reference canvas notes and interact with LLM
 */
export class ChatInterface extends BaseComponent {
  constructor() {
    super();
    this.isOpen = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.position = { x: 50, y: 50 };
    this.messages = [];
    this.selectedNotes = new Set();
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          position: fixed;
          top: ${this.position.y}px;
          left: ${this.position.x}px;
          z-index: 5000;
          display: none;
          font-family: 'Inter', sans-serif;
        }

        :host(.show) {
          display: block;
        }

        .chat-container {
          width: 400px;
          height: 500px;
          background: var(--bg-elevated);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 2px solid var(--border-primary);
        }

        .chat-header {
          background: var(--chat-header);
          color: var(--text-inverse);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          user-select: none;
        }

        .chat-title {
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .note-selector {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-secondary);
          background: var(--bg-secondary);
        }

        .note-selector-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .note-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 80px;
          overflow-y: auto;
        }

        .note-chip {
          background: var(--bg-tertiary);
          border: 1px solid var(--brand-primary);
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-primary);
        }

        .note-chip.selected {
          background: var(--brand-primary);
          color: var(--text-inverse);
        }

        .note-chip:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          max-width: 85%;
          word-wrap: break-word;
        }

        .message.user {
          align-self: flex-end;
          background: var(--message-user-bg);
          color: var(--text-inverse);
          padding: 8px 12px;
          border-radius: 16px 16px 4px 16px;
        }

        .message.assistant {
          align-self: flex-start;
          background: var(--message-ai-bg);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: 16px 16px 16px 4px;
          border: 1px solid var(--border-primary);
        }

        .message.system {
          align-self: center;
          background: var(--message-system-bg);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          border: 1px solid var(--border-secondary);
        }

        .typing-indicator {
          align-self: flex-start;
          background: #f5f5f5;
          padding: 8px 12px;
          border-radius: 16px 16px 16px 4px;
          border: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-dots {
          display: flex;
          gap: 2px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #999;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-8px); opacity: 1; }
        }

        .chat-input-area {
          padding: 12px 16px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chat-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-family: inherit;
          resize: none;
          min-height: 20px;
          max-height: 80px;
          overflow-y: auto;
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--focus-ring);
        }

        .send-btn {
          background: var(--brand-primary);
          border: none;
          color: var(--text-inverse);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .send-btn:hover {
          background: var(--brand-secondary);
        }

        .send-btn:disabled {
          background: var(--text-tertiary);
          cursor: not-allowed;
        }

        .quick-actions {
          padding: 8px 16px;
          border-top: 1px solid var(--border-secondary);
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          background: var(--bg-secondary);
        }

        .quick-action {
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary);
        }

        .quick-action:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }
      </style>

      <div class="chat-container">
        <div class="chat-header" id="chatHeader">
          <div class="chat-title">
            <span class="material-icons">chat</span>
            Canvas Chat
          </div>
          <button class="close-btn" id="closeBtn">✕</button>
        </div>

        <div class="note-selector">
          <div class="note-selector-label">Reference Notes:</div>
          <div class="note-chips" id="noteChips">
            <!-- Note chips will be populated dynamically -->
          </div>
        </div>

        <div class="chat-messages" id="chatMessages">
          <!-- Messages will be added dynamically -->
        </div>

        <div class="quick-actions">
          <button class="quick-action" data-action="summarize">📝 Summarize selected notes</button>
          <button class="quick-action" data-action="connections">🔗 Find connections</button>
          <button class="quick-action" data-action="improve">✨ Suggest improvements</button>
          <button class="quick-action" data-action="questions">❓ Generate questions</button>
        </div>

        <div class="chat-input-area">
          <textarea class="chat-input" id="chatInput" placeholder="Ask about your notes, request changes, or get suggestions..." rows="1"></textarea>
          <button class="send-btn" id="sendBtn">
            <span class="material-icons">send</span>
          </button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupDragging();
    this.populateNoteChips();
    this.addWelcomeMessage();
  }

  attachEventListeners() {
    // Close button
    this.$('#closeBtn')?.addEventListener('click', () => {
      this.close();
    });

    // Send message
    this.$('#sendBtn')?.addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter to send (Shift+Enter for new line)
    this.$('#chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize input
    this.$('#chatInput')?.addEventListener('input', (e) => {
      const input = e.target;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });

    // Quick actions
    this.shadowRoot.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Subscribe to state changes to update note chips
    stateManager.subscribe(() => {
      this.populateNoteChips();
    });
  }

  setupDragging() {
    const header = this.$('#chatHeader');
    if (!header) return;

    header.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y
      };
      
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.handleDragEnd);
      
      e.preventDefault();
    });
  }

  handleDrag = (e) => {
    if (!this.isDragging) return;
    
    this.position = {
      x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - this.dragOffset.x)),
      y: Math.max(0, Math.min(window.innerHeight - 500, e.clientY - this.dragOffset.y))
    };
    
    this.style.left = this.position.x + 'px';
    this.style.top = this.position.y + 'px';
  }

  handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  populateNoteChips() {
    const noteChips = this.$('#noteChips');
    if (!noteChips) return;

    const notes = stateManager.getState().notes;
    noteChips.innerHTML = '';

    if (notes.length === 0) {
      noteChips.innerHTML = '<div style="color: #999; font-size: 0.8rem;">No notes available</div>';
      return;
    }

    notes.forEach(note => {
      const chip = document.createElement('div');
      chip.className = 'note-chip';
      if (this.selectedNotes.has(note.id)) {
        chip.classList.add('selected');
      }
      
      const title = note.title || 'Untitled';
      chip.innerHTML = `
        <span>${title.length > 15 ? title.substring(0, 15) + '...' : title}</span>
      `;
      
      chip.addEventListener('click', () => {
        if (this.selectedNotes.has(note.id)) {
          this.selectedNotes.delete(note.id);
          chip.classList.remove('selected');
        } else {
          this.selectedNotes.add(note.id);
          chip.classList.add('selected');
        }
      });
      
      noteChips.appendChild(chip);
    });
  }

  addWelcomeMessage() {
    this.addMessage('system', '💬 Chat with your notes! Select notes above to reference them in conversation.');
  }

  addMessage(type, content, streaming = false) {
    const messagesContainer = this.$('#chatMessages');
    if (!messagesContainer) return;

    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    if (streaming) {
      message.id = 'streaming-message';
    }
    
    message.textContent = content;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messages.push({ type, content });
  }

  showTypingIndicator() {
    const messagesContainer = this.$('#chatMessages');
    if (!messagesContainer) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
      <span style="margin-left: 8px; color: #666;">AI is thinking...</span>
    `;
    
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = this.$('#typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  async sendMessage() {
    const input = this.$('#chatInput');
    const sendBtn = this.$('#sendBtn');
    if (!input || !sendBtn) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // Disable send button
    sendBtn.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Prepare context from selected notes
      const context = this.getSelectedNotesContext();
      
      // Create prompt with context
      const prompt = this.createPromptWithContext(message, context);
      
      // Get streaming response
      this.hideTypingIndicator();
      
      let response = '';
      const streamingMessage = document.createElement('div');
      streamingMessage.className = 'message assistant';
      streamingMessage.id = 'streaming-message';
      
      const messagesContainer = this.$('#chatMessages');
      messagesContainer.appendChild(streamingMessage);
      
      for await (const chunk of llmService.generateStream(prompt, { temperature: 0.7, maxTokens: 1024 })) {
        response += chunk;
        streamingMessage.textContent = response;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      streamingMessage.removeAttribute('id');
      this.messages.push({ type: 'assistant', content: response });
      
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('system', `❌ Error: ${error.message}. Please check your LLM configuration.`);
    } finally {
      sendBtn.disabled = false;
    }
  }

  getSelectedNotesContext() {
    const notes = stateManager.getState().notes;
    const selectedNotes = notes.filter(note => this.selectedNotes.has(note.id));
    
    if (selectedNotes.length === 0) {
      return 'No specific notes are currently selected for reference.';
    }
    
    return selectedNotes.map(note => `
**${note.title || 'Untitled'}**
${note.text || '(empty)'}
    `.trim()).join('\n\n');
  }

  createPromptWithContext(userMessage, context) {
    return `You are an AI assistant helping a user work with their notes in a visual note-taking application. 

Current Notes Context:
${context}

User Question: ${userMessage}

Please provide helpful, concise responses. If the user asks about making changes to notes, suggest specific modifications. If they ask about connections or relationships, analyze the content provided.`;
  }

  handleQuickAction(action) {
    const context = this.getSelectedNotesContext();
    if (context === 'No specific notes are currently selected for reference.') {
      this.addMessage('system', '⚠️ Please select some notes first to use quick actions.');
      return;
    }

    let prompt = '';
    switch (action) {
      case 'summarize':
        prompt = 'Please provide a concise summary of the selected notes.';
        break;
      case 'connections':
        prompt = 'What connections and relationships do you see between the selected notes?';
        break;
      case 'improve':
        prompt = 'How could I improve or expand on these notes? What might be missing?';
        break;
      case 'questions':
        prompt = 'What interesting questions arise from these notes that I could explore further?';
        break;
    }

    if (prompt) {
      const input = this.$('#chatInput');
      if (input) {
        input.value = prompt;
        this.sendMessage();
      }
    }
  }

  open() {
    this.classList.add('show');
    this.isOpen = true;
    this.populateNoteChips();
    
    // Focus input
    setTimeout(() => {
      const input = this.$('#chatInput');
      if (input) input.focus();
    }, 100);
  }

  close() {
    this.classList.remove('show');
    this.isOpen = false;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

customElements.define('chat-interface', ChatInterface);