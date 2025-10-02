import { BaseComponent } from '../utils/base-component.js';
import { llmService } from '../services/llm-service.js';
import { stateManager } from '../services/state-manager.js';
import { semanticAnalysisService } from "../services/semantic-analysis-service.js";

/**
 * AnalysisScratchNode Component
 * Shows real-time streaming analysis with progress indicators
 */
export class AnalysisScratchNode extends BaseComponent {
  constructor() {
    super();
    this.isAnalyzing = false;
    this.analysisChunks = [];
    this.currentStream = null;
    this.position = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          position: absolute;
          width: 300px;
          min-height: 200px;
          z-index: 1000;
          left: ${this.position.x}px;
          top: ${this.position.y}px;
        }

        .scratch-node {
          background: var(--analysis-header);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 2px solid var(--border-primary);
          backdrop-filter: blur(10px);
          font-family: 'Inter', sans-serif;
        }

        .node-header {
          background: rgba(255,255,255,0.1);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          user-select: none;
          color: var(--text-inverse);
        }

        .node-title {
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .node-controls {
          display: flex;
          gap: 6px;
        }

        .control-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: background 0.2s;
        }

        .control-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .analysis-content {
          background: var(--bg-elevated);
          color: var(--text-primary);
          max-height: 400px;
          overflow-y: auto;
        }

        .prompt-section {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-secondary);
        }

        .prompt-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 500;
        }

        .prompt-input {
          width: 100%;
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 0.85rem;
          font-family: inherit;
          resize: vertical;
          min-height: 60px;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--focus-ring);
        }

        .analysis-actions {
          padding: 8px 16px;
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-secondary);
        }

        .action-btn {
          background: var(--brand-primary);
          border: none;
          color: var(--text-inverse);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: background 0.2s;
          flex: 1;
        }

        .action-btn:hover {
          background: var(--brand-secondary);
        }

        .action-btn:disabled {
          background: var(--text-tertiary);
          cursor: not-allowed;
        }

        .action-btn.secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
        }

        .action-btn.secondary:hover {
          background: var(--hover-bg);
        }

        .progress-section {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-secondary);
          display: none;
        }

        .progress-section.show {
          display: block;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .progress-label {
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
        }

        .progress-status {
          font-size: 0.75rem;
          color: #999;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #eee;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .progress-fill.indeterminate {
          width: 30%;
          animation: progress-slide 2s infinite;
        }

        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(333%); }
        }

        .chunk-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .chunk-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ddd;
          transition: background 0.2s;
        }

        .chunk-dot.received {
          background: #4caf50;
          animation: chunk-pulse 0.5s ease;
        }

        @keyframes chunk-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .streaming-content {
          padding: 12px 16px;
          max-height: 200px;
          overflow-y: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          line-height: 1.4;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          display: none;
        }

        .streaming-content.show {
          display: block;
        }

        .stream-chunk {
          margin-bottom: 4px;
          padding: 2px 4px;
          border-radius: 3px;
          background: rgba(102, 126, 234, 0.1);
          border-left: 2px solid #667eea;
          animation: chunk-appear 0.3s ease;
        }

        @keyframes chunk-appear {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .analysis-result {
          padding: 12px 16px;
          display: none;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .analysis-result.show {
          display: block;
        }

        .result-section {
          margin-bottom: 16px;
        }

        .result-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }

        .result-content {
          color: #555;
          white-space: pre-wrap;
        }

        .stats-bar {
          padding: 8px 16px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
          font-size: 0.75rem;
          color: #666;
          display: flex;
          justify-content: space-between;
        }

        .empty-state {
          padding: 24px 16px;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 0.85rem;
          line-height: 1.4;
        }
      </style>

      <div class="scratch-node">
        <div class="node-header" id="nodeHeader">
          <div class="node-title">
            <span class="material-icons">analytics</span>
            Analysis Scratch
          </div>
          <div class="node-controls">
            <button class="control-btn" id="minimizeBtn" title="Minimize">−</button>
            <button class="control-btn" id="closeBtn" title="Close">✕</button>
          </div>
        </div>

        <div class="analysis-content" id="analysisContent">
          <div class="prompt-section">
            <div class="prompt-label">Analysis Prompt:</div>
            <textarea 
              class="prompt-input" 
              id="promptInput" 
              placeholder="Enter your analysis prompt here... (e.g., 'Analyze the key themes and connections in my notes')"
            >Analyze the key themes, patterns, and connections in the current canvas. Provide insights about the relationships between ideas and suggest potential areas for further exploration.</textarea>
          </div>

          <div class="analysis-actions">
            <button class="action-btn" id="analyzeBtn">🚀 Start Analysis</button>
            <button class="action-btn" id="semanticBtn">🧠 Build Graph</button>
            <button class="action-btn secondary" id="stopBtn" disabled>⏹️ Stop</button>
          </div>

          <div class="progress-section" id="progressSection">
            <div class="progress-header">
              <div class="progress-label">Analyzing...</div>
              <div class="progress-status" id="progressStatus">Preparing...</div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill indeterminate" id="progressFill"></div>
            </div>
            <div class="chunk-indicators" id="chunkIndicators"></div>
          </div>

          <div class="streaming-content" id="streamingContent"></div>

          <div class="analysis-result" id="analysisResult">
            <div class="empty-state">
              <div class="empty-icon">🧠</div>
              <div class="empty-text">
                Start an analysis to see real-time streaming results.<br>
                The AI will analyze your canvas and provide insights.
              </div>
            </div>
          </div>
        </div>

        <div class="stats-bar" id="statsBar">
          <span>Ready</span>
          <span id="tokenCount">0 tokens</span>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupDragging();
    this.updatePosition();
  }

  attachEventListeners() {
    // Control buttons
    this.$("#closeBtn")?.addEventListener("click", () => {
      this.remove();
    });

    this.$("#minimizeBtn")?.addEventListener("click", () => {
      this.toggleMinimize();
    });

    // Analysis actions
    this.$("#analyzeBtn")?.addEventListener("click", () => {
      this.startAnalysis();
    });

    this.$("#semanticBtn")?.addEventListener("click", () => {
      this.startSemanticAnalysis();
    });

    this.$("#stopBtn")?.addEventListener("click", () => {
      this.stopAnalysis();
    });

    // Auto-resize prompt input
    this.$("#promptInput")?.addEventListener("input", (e) => {
      const input = e.target;
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
  }

  setupDragging() {
    const header = this.$("#nodeHeader");
    if (!header) return;

    header.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.dragOffset = {
        x: e.clientX - this.position.x,
        y: e.clientY - this.position.y,
      };

      document.addEventListener("mousemove", this.handleDrag);
      document.addEventListener("mouseup", this.handleDragEnd);

      e.preventDefault();
    });
  }

  handleDrag = (e) => {
    if (!this.isDragging) return;

    this.position = {
      x: Math.max(0, e.clientX - this.dragOffset.x),
      y: Math.max(0, e.clientY - this.dragOffset.y),
    };

    this.updatePosition();
  };

  handleDragEnd = () => {
    this.isDragging = false;
    document.removeEventListener("mousemove", this.handleDrag);
    document.removeEventListener("mouseup", this.handleDragEnd);
  };

  updatePosition() {
    this.style.left = this.position.x + "px";
    this.style.top = this.position.y + "px";
  }

  async startAnalysis() {
    if (this.isAnalyzing) return;

    const promptInput = this.$("#promptInput");
    const analyzeBtn = this.$("#analyzeBtn");
    const stopBtn = this.$("#stopBtn");

    if (!promptInput || !analyzeBtn || !stopBtn) return;

    const prompt = promptInput.value.trim();
    if (!prompt) {
      this.showError("Please enter an analysis prompt");
      return;
    }

    // Reset state
    this.isAnalyzing = true;
    this.analysisChunks = [];

    // Update UI
    analyzeBtn.disabled = true;
    stopBtn.disabled = false;

    this.showProgress();
    this.updateStatus("Initializing analysis...");

    try {
      // Get canvas context
      const context = this.getCanvasContext();
      const fullPrompt = this.createAnalysisPrompt(prompt, context);

      // Clear previous results
      this.clearResults();
      this.showStreamingContent();

      let fullResponse = "";
      let chunkCount = 0;

      this.updateStatus("Streaming analysis...");

      // Start streaming
      this.currentStream = llmService.generateStream(fullPrompt, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      for await (const chunk of this.currentStream) {
        if (!this.isAnalyzing) break; // Check if stopped

        fullResponse += chunk;
        chunkCount++;

        this.addStreamChunk(chunk);
        this.updateChunkIndicators(chunkCount);
        this.updateTokenCount(fullResponse);

        // Update status periodically
        if (chunkCount % 10 === 0) {
          this.updateStatus(`Processing... ${chunkCount} chunks received`);
        }
      }

      // Analysis complete
      this.updateStatus("Analysis complete!");
      this.showAnalysisResult(fullResponse);
      this.hideProgress();
    } catch (error) {
      this.showError(`Analysis failed: ${error.message}`);
      this.hideProgress();
    } finally {
      this.isAnalyzing = false;
      analyzeBtn.disabled = false;
      stopBtn.disabled = true;
      this.currentStream = null;
    }
  }

  stopAnalysis() {
    if (!this.isAnalyzing) return;

    this.isAnalyzing = false;
    this.currentStream = null;

    this.updateStatus("Analysis stopped");
    this.hideProgress();

    const analyzeBtn = this.$("#analyzeBtn");
    const stopBtn = this.$("#stopBtn");

    if (analyzeBtn) analyzeBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
  }

  getCanvasContext() {
    const state = stateManager.getState();
    const notes = state.notes || [];
    const connections = state.connections || [];

    if (notes.length === 0) {
      return "The canvas is currently empty - no notes or connections available for analysis.";
    }

    let context = `Canvas contains ${notes.length} notes and ${connections.length} connections.\n\n`;

    // Add notes
    context += "NOTES:\n";
    notes.forEach((note, index) => {
      context += `${index + 1}. ${note.title || "Untitled"}\n`;
      if (note.text) {
        context += `   ${note.text.substring(0, 200)}${
          note.text.length > 200 ? "..." : ""
        }\n`;
      }
      context += "\n";
    });

    // Add connections if any
    if (connections.length > 0) {
      context += "CONNECTIONS:\n";
      connections.forEach((conn, index) => {
        const sourceNote = notes.find((n) => n.id === conn.source);
        const targetNote = notes.find((n) => n.id === conn.target);
        context += `${index + 1}. "${sourceNote?.title || "Unknown"}" → "${
          targetNote?.title || "Unknown"
        }"\n`;
      });
    }

    return context;
  }

  createAnalysisPrompt(userPrompt, context) {
    return `You are an AI assistant analyzing a visual note-taking canvas. Please provide a thorough analysis based on the user's request.

CANVAS CONTEXT:
${context}

USER REQUEST:
${userPrompt}

Please provide a detailed, structured analysis. Use clear headings and bullet points where appropriate. Focus on actionable insights and concrete observations.`;
  }

  showProgress() {
    const progressSection = this.$("#progressSection");
    if (progressSection) {
      progressSection.classList.add("show");
    }
  }

  hideProgress() {
    const progressSection = this.$("#progressSection");
    if (progressSection) {
      progressSection.classList.remove("show");
    }
  }

  updateStatus(status) {
    const statusEl = this.$("#progressStatus");
    if (statusEl) {
      statusEl.textContent = status;
    }

    const statsBar = this.$("#statsBar");
    if (statsBar) {
      const statusSpan = statsBar.firstElementChild;
      if (statusSpan) {
        statusSpan.textContent = status;
      }
    }
  }

  showStreamingContent() {
    const streamingContent = this.$("#streamingContent");
    const analysisResult = this.$("#analysisResult");

    if (streamingContent) streamingContent.classList.add("show");
    if (analysisResult) analysisResult.classList.remove("show");
  }

  addStreamChunk(chunk) {
    const streamingContent = this.$("#streamingContent");
    if (!streamingContent) return;

    const chunkEl = document.createElement("div");
    chunkEl.className = "stream-chunk";
    chunkEl.textContent = chunk;

    streamingContent.appendChild(chunkEl);
    streamingContent.scrollTop = streamingContent.scrollHeight;
  }

  updateChunkIndicators(chunkCount) {
    const indicators = this.$("#chunkIndicators");
    if (!indicators) return;

    // Add dots for every 5 chunks
    const dotCount = Math.floor(chunkCount / 5);
    const currentDots = indicators.children.length;

    for (let i = currentDots; i < dotCount; i++) {
      const dot = document.createElement("div");
      dot.className = "chunk-dot received";
      indicators.appendChild(dot);
    }
  }

  updateTokenCount(text) {
    const tokenCount = this.$("#tokenCount");
    if (tokenCount) {
      // Rough token estimation
      const tokens = Math.floor(text.length / 4);
      tokenCount.textContent = `~${tokens} tokens`;
    }
  }

  showAnalysisResult(result) {
    const streamingContent = this.$("#streamingContent");
    const analysisResult = this.$("#analysisResult");

    if (streamingContent) streamingContent.classList.remove("show");
    if (analysisResult) {
      analysisResult.classList.add("show");
      analysisResult.innerHTML = `
        <div class="result-section">
          <div class="result-title">📊 Analysis Results</div>
          <div class="result-content">${this.formatAnalysisResult(result)}</div>
        </div>
      `;
    }
  }

  formatAnalysisResult(result) {
    // Basic formatting for analysis results
    return result
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  /**
   * Start semantic analysis to build relationship graph
   */
  async startSemanticAnalysis() {
    const state = stateManager.getState();
    const notes = state.notes || [];

    if (notes.length < 2) {
      this.addChunk(
        "🔍 **Semantic Analysis**\n\nNeed at least 2 notes to establish relationships.",
        "info"
      );
      return;
    }

    this.clearResults();
    this.showProgress();
    this.updateStatus("Building semantic graph...");

    const streamingContent = this.$("#streamingContent");
    if (streamingContent) {
      streamingContent.classList.add("show");
    }

    this.addChunk(
      "🧠 **Building Semantic Graph**\n\nAnalyzing relationships between notes...",
      "analysis"
    );

    try {
      const result = await semanticAnalysisService.analyzeNotes(notes);

      if (result && result.connections) {
        // Update state with new connections
        await semanticAnalysisService.updateStateWithResults(result);

        // Display formatted results
        const formattedResults = semanticAnalysisService.formatResults(result);
        this.addChunk(formattedResults, "analysis");

        // Trigger connection rendering in the main app
        const event = new CustomEvent("connections-updated", {
          detail: {
            connections: result.connections,
            clusters: result.clusters,
          },
          bubbles: true,
        });
        this.dispatchEvent(event);

        this.updateStatus(
          `✅ Found ${result.connections.length} relationships`
        );
      } else {
        this.addChunk(
          "⚠️ No clear relationships detected. Try positioning related notes closer together.",
          "warning"
        );
        this.updateStatus("No relationships found");
      }
    } catch (error) {
      console.error("Semantic analysis error:", error);
      this.addChunk(`❌ **Analysis Error**: ${error.message}`, "error");
      this.updateStatus("Analysis failed");
    } finally {
      this.hideProgress();

      // Update button states
      const semanticBtn = this.$("#semanticBtn");
      if (semanticBtn) semanticBtn.disabled = false;
    }
  }

  clearResults() {
    const streamingContent = this.$("#streamingContent");
    const analysisResult = this.$("#analysisResult");
    const chunkIndicators = this.$("#chunkIndicators");

    if (streamingContent) {
      streamingContent.innerHTML = "";
      streamingContent.classList.remove("show");
    }

    if (analysisResult) {
      analysisResult.classList.remove("show");
    }

    if (chunkIndicators) {
      chunkIndicators.innerHTML = "";
    }
  }

  showError(message) {
    this.updateStatus(`❌ ${message}`);
    setTimeout(() => {
      this.updateStatus("Ready");
    }, 3000);
  }

  toggleMinimize() {
    const content = this.$("#analysisContent");
    if (content) {
      const isMinimized = content.style.display === "none";
      content.style.display = isMinimized ? "block" : "none";

      const btn = this.$("#minimizeBtn");
      if (btn) {
        btn.textContent = isMinimized ? "−" : "+";
      }
    }
  }

  // Public method to set position
  setPosition(x, y) {
    this.position = { x, y };
    this.updatePosition();
  }
}

customElements.define('analysis-scratch-node', AnalysisScratchNode);