import { BaseComponent } from '../utils/base-component.js';
import { stateManager } from '../services/state-manager.js';
import { indexedDBService } from "../services/indexeddb-service.js";
import { llmService } from "../services/llm-service.js";
import { themeService } from "../../services/theme-service.js";
import { sampleCanvasService } from "../services/sample-canvas-service.js";
import "./neuro-header.js";
import "./neuro-hamburger.js";
import "./neuro-note-card.js";
import "./template-wizard.js";
import "./chat-interface.js";
import "../nodes/analysis-scratch-node.js";

/**
 * NeuroApp Component
 * Main application shell that orchestrates all components
 */
export class NeuroApp extends BaseComponent {
  constructor() {
    super();
    this.state = stateManager.getState();
  }

  connectedCallback() {
    super.connectedCallback();

    // Subscribe to state changes
    stateManager.subscribe((oldState, newState) => {
      this.state = newState;
      this.renderNotes();
      this.updateHeader();

      // Auto-save after state changes (debounced)
      clearTimeout(this._saveTimeout);
      this._saveTimeout = setTimeout(() => {
        this.saveToStorage();
      }, 1000);
    });

    // Initial render of notes
    this.renderNotes();

    // Load last canvas or show first-time experience
    this.loadLastCanvas();

    // Show first-time user experience if needed
    setTimeout(() => {
      sampleCanvasService.showFirstTimeExperience();
    }, 1000);

    // Initialize theme icon
    setTimeout(() => {
      this.updateThemeIcon();
    }, 100);
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          display: block;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .app-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
          cursor: grab;
          background-image: 
            radial-gradient(circle, var(--canvas-grid) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        #noteCanvas {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-origin: 0 0;
          transition: transform 0.1s ease-out;
        }

        #connectionOverlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          transform-origin: 0 0;
        }

        /* Drawers */
        .drawer {
          position: fixed;
          top: 0;
          width: 320px;
          height: 100vh;
          background: var(--drawer-bg);
          box-shadow: var(--shadow-lg);
          z-index: 2000;
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .left-drawer {
          left: 0;
          transform: translateX(-100%);
        }

        .left-drawer.open {
          transform: translateX(0);
        }

        .right-drawer {
          right: 0;
          transform: translateX(100%);
        }

        .right-drawer.open {
          transform: translateX(0);
        }

        .drawer-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .drawer-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .canvas-list {
          margin-bottom: 16px;
        }

        .canvas-item {
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s;
        }

        .canvas-item:hover {
          background: #f5f5f5;
        }

        .canvas-item.active {
          background: #e3f2fd;
          font-weight: 600;
        }

        .drawer-action-btn {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 500;
        }

        .drawer-action-btn:hover {
          background: #5568d3;
        }

        .settings-form label {
          display: block;
          margin-top: 16px;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .settings-form input,
        .settings-form select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
        }

        .settings-form input[type="range"] {
          width: calc(100% - 50px);
          display: inline-block;
        }

        #tempValue {
          display: inline-block;
          width: 40px;
          text-align: right;
          font-weight: 600;
          margin-left: 8px;
        }

        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 1999;
          display: none;
        }

        .drawer-overlay.show {
          display: block;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Floating Action Buttons */
        .fab-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 2000;
        }

        .fab {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
          font-size: 24px;
          color: white;
        }

        .fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }

        .fab.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .fab.secondary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .fab.theme {
          background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
        }

        .fab:active {
          transform: scale(0.95);
        }
      </style>

      <div class="app-container">
        <neuro-header 
          id="header"
          canvas-name="${this.state.currentCanvasName}"
          is-dirty="${this.state.isDirty}">
        </neuro-header>

        <neuro-hamburger 
          id="leftHamburger"
          position="left" 
          icon="menu">
        </neuro-hamburger>

        <neuro-hamburger 
          id="rightHamburger"
          position="right" 
          icon="settings">
        </neuro-hamburger>

        <div class="canvas-container" id="canvasContainer">
          <div id="noteCanvas"></div>
          <svg id="connectionOverlay">
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#666"/>
              </marker>
            </defs>
          </svg>
        </div>

        <!-- Left Drawer (Canvas List) -->
        <div class="drawer left-drawer" id="leftDrawer">
          <div class="drawer-header">
            <h3>Canvas List</h3>
            <button class="close-btn" id="closeLeftDrawer">✕</button>
          </div>
          <div class="drawer-content">
            <div class="canvas-list" id="canvasList">
              <!-- Canvas items will be populated dynamically -->
            </div>
            <button class="drawer-action-btn" id="newCanvasBtn">
              <span class="material-icons">add</span>
              New Canvas
            </button>
          </div>
        </div>

        <!-- Right Drawer (Settings) -->
        <div class="drawer right-drawer" id="rightDrawer">
          <div class="drawer-header">
            <h3>LLM Settings</h3>
            <button class="close-btn" id="closeRightDrawer">✕</button>
          </div>
          <div class="drawer-content">
            <div class="settings-form">
              <label>Provider</label>
              <select id="llmProvider">
                <option value="webllm">WebLLM (Browser-based, FREE)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="ollama">Ollama (Local)</option>
              </select>

              <label style="display: flex; justify-content: space-between; align-items: center;">
                <span>Model</span>
                <button id="refreshModelsBtn" style="background: none; border: none; color: #667eea; cursor: pointer; padding: 4px; display: flex; align-items: center; gap: 4px;" title="Refresh models from provider">
                  <span class="material-icons" style="font-size: 18px;">refresh</span>
                  <span style="font-size: 0.85rem;">Refresh</span>
                </button>
              </label>
              <select id="llmModel">
                <option value="">Select a model...</option>
              </select>

              <label>API Key <span id="apiKeyLabel" style="color: #999; font-size: 0.85rem;">(not needed for WebLLM)</span></label>
              <input type="password" id="llmApiKey" placeholder="Enter API key for selected provider">

              <label>Endpoint <span id="endpointLabel" style="color: #999; font-size: 0.85rem;">(for Ollama only)</span></label>
              <input type="text" id="llmEndpoint" value="http://localhost:11434" placeholder="API endpoint">

              <label>Temperature (0-2)</label>
              <input type="range" id="llmTemp" min="0" max="2" step="0.1" value="0.7">
              <span id="tempValue">0.7</span>

              <div id="webllmControls" style="margin-top: 20px; display: none;">
                <button class="drawer-action-btn" id="loadWebLLMBtn" style="background: #28a745;">
                  <span class="material-icons">download</span>
                  Load WebLLM Model
                </button>
                <div id="webllmProgress" style="margin-top: 10px; display: none;">
                  <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden; height: 20px;">
                    <div id="webllmProgressBar" style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: 0%; transition: width 0.3s;"></div>
                  </div>
                  <p id="webllmProgressText" style="margin-top: 8px; font-size: 0.9rem; color: #666;">Initializing...</p>
                </div>
              </div>

              <button class="drawer-action-btn" id="saveSettingsBtn">
                <span class="material-icons">save</span>
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <!-- Drawer Overlay -->
        <div class="drawer-overlay" id="drawerOverlay"></div>

        <!-- Template Wizard -->
        <template-wizard id="templateWizard"></template-wizard>

        <!-- Chat Interface -->
        <chat-interface id="chatInterface"></chat-interface>

        <!-- Floating Action Buttons -->
        <div class="fab-container">
          <button class="fab theme" id="themeFab" title="Toggle Theme">
            <span class="material-icons">light_mode</span>
          </button>
          <button class="fab secondary" id="analysisFab" title="Start Analysis">
            <span class="material-icons">analytics</span>
          </button>
          <button class="fab secondary" id="beautifyFab" title="Beautify Layout">
            <span class="material-icons">auto_fix_high</span>
          </button>
          <button class="fab primary" id="chatFab" title="Open Chat">
            <span class="material-icons">chat</span>
          </button>
        </div>
      </div>
    `;

    this.attachComponentEventListeners();
    this.attachDrawerListeners();
  }

  attachComponentEventListeners() {
    // Header events
    const header = this.$("#header");
    header?.addEventListener("new-note-clicked", () => this.createNewNote());
    header?.addEventListener("analyze-clicked", () =>
      this.createAnalysisScratchNode()
    );
    header?.addEventListener("beautify-clicked", () => this.beautifyLayout());
    header?.addEventListener("export-clicked", () => this.showExportMenu());
    header?.addEventListener("template-clicked", () =>
      this.openTemplateWizard()
    );

    // Hamburger events
    this.$("#leftHamburger")?.addEventListener("hamburger-clicked", () => {
      this.toggleLeftDrawer();
    });

    this.$("#rightHamburger")?.addEventListener("hamburger-clicked", () => {
      this.toggleRightDrawer();
    });

    // Floating Action Button events
    this.$("#chatFab")?.addEventListener("click", () => {
      this.toggleChatInterface();
    });

    this.$("#analysisFab")?.addEventListener("click", () => {
      this.createAnalysisScratchNode();
    });

    this.$("#beautifyFab")?.addEventListener("click", () => {
      this.beautifyLayout();
    });

    this.$("#themeFab")?.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Canvas pan/zoom
    this.setupCanvasInteraction();

    // Global event listeners
    document.addEventListener("open-settings", () => {
      this.toggleRightDrawer();
    });

    // Listen for semantic analysis results
    document.addEventListener("connections-updated", (event) => {
      console.log("🧠 Received semantic analysis results:", event.detail);
      this.renderConnections();
    });
  }

  setupCanvasInteraction() {
    const container = this.$("#canvasContainer");
    const canvas = this.$("#noteCanvas");

    if (!container || !canvas) return;

    let isPanning = false;
    let startX = 0,
      startY = 0;
    let startPanX = 0,
      startPanY = 0;

    // Pan
    container.addEventListener("mousedown", (e) => {
      // Allow panning on container or canvas background, but not on notes or UI elements
      if (
        e.target === container ||
        e.target.id === "noteCanvas" ||
        e.target.classList.contains("canvas-background")
      ) {
        e.preventDefault();
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        startPanX = this.state.pan.x;
        startPanY = this.state.pan.y;
        container.style.cursor = "grabbing";
        document.body.style.userSelect = "none"; // Prevent text selection while panning
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isPanning) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        stateManager.setState({
          pan: {
            x: startPanX + dx,
            y: startPanY + dy,
          },
        });
        this.updateCanvasTransform();
      }
    });

    document.addEventListener("mouseup", () => {
      if (isPanning) {
        isPanning = false;
        container.style.cursor = "grab";
        document.body.style.userSelect = "";
      }
    });

    // Add mouseleave to handle when mouse leaves window while panning
    document.addEventListener("mouseleave", () => {
      if (isPanning) {
        isPanning = false;
        container.style.cursor = "grab";
        document.body.style.userSelect = "";
      }
    });

    // Zoom
    container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const zoomFactor = 1.08;
        const newZoom =
          e.deltaY < 0
            ? Math.min(3, this.state.zoom * zoomFactor)
            : Math.max(0.2, this.state.zoom / zoomFactor);

        stateManager.setState({ zoom: newZoom });
        this.updateCanvasTransform();
      },
      { passive: false }
    );
  }

  updateCanvasTransform() {
    const canvas = this.$("#noteCanvas");
    const overlay = this.$("#connectionOverlay");
    const { pan, zoom } = this.state;

    if (canvas) {
      canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    }
    if (overlay) {
      overlay.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    }
  }

  /**
   * Force-directed layout algorithm for auto-beautification
   */
  beautifyLayout(iterations = 120) {
    const notes = this.state.notes;
    const connections = this.state.connections || [];

    if (notes.length === 0) {
      console.log("⚠️ No notes to beautify");
      return;
    }

    console.log(
      `🎨 Beautifying layout with ${notes.length} notes and ${connections.length} connections`
    );

    // Parameters
    const repulsionStrength = 8000;
    const attractionStrength = 0.01;
    const springLength = 300;
    const damping = 0.85;
    const centerStrength = 0.001;
    const minDistance = 250;

    // Initialize velocities
    notes.forEach((n) => {
      n.vx = n.vx || 0;
      n.vy = n.vy || 0;
    });

    // Calculate center of mass
    const centerX = 600;
    const centerY = 400;

    // Simulation loop
    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      notes.forEach((n) => {
        n.fx = 0;
        n.fy = 0;
      });

      // Repulsion between all notes (prevent overlap)
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const a = notes[i];
          const b = notes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < minDistance) {
            const force = repulsionStrength / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.fx -= fx;
            a.fy -= fy;
            b.fx += fx;
            b.fy += fy;
          }
        }
      }

      // Attraction along connections (spring force)
      connections.forEach((conn) => {
        const sourceId = conn.from || conn.sourceId;
        const targetId = conn.to || conn.targetId;
        const source = notes.find((n) => n.id === sourceId);
        const target = notes.find((n) => n.id === targetId);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = attractionStrength * (dist - springLength);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.fx += fx;
        source.fy += fy;
        target.fx -= fx;
        target.fy -= fy;
      });

      // Gentle pull toward center
      notes.forEach((n) => {
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.fx += dx * centerStrength;
        n.fy += dy * centerStrength;
      });

      // Update positions
      notes.forEach((n) => {
        n.vx = (n.vx + n.fx) * damping;
        n.vy = (n.vy + n.fy) * damping;
        n.x += n.vx;
        n.y += n.vy;

        // Keep within bounds
        n.x = Math.max(50, Math.min(1800, n.x));
        n.y = Math.max(50, Math.min(1200, n.y));
      });
    }

    // Clean up velocity properties
    notes.forEach((n) => {
      delete n.vx;
      delete n.vy;
      delete n.fx;
      delete n.fy;
    });

    // Update state and re-render
    stateManager.setState({ notes });
    console.log("✨ Layout beautification complete");
  }

  renderNotes() {
    const canvas = this.$("#noteCanvas");
    if (!canvas) {
      console.warn("⚠️ Note canvas not found!");
      return;
    }

    console.log(`📝 Rendering ${this.state.notes.length} notes...`);

    // Clear existing notes
    canvas.innerHTML = "";

    // Render each note
    this.state.notes.forEach((note) => {
      console.log(
        "Creating note card:",
        note.id,
        note.title,
        `at (${note.x}, ${note.y})`
      );
      const noteCard = document.createElement("neuro-note-card");
      noteCard.setNoteData(note);

      // Debug: Check if note card was created
      console.log(
        "  → Note card element:",
        noteCard.tagName,
        "visible:",
        noteCard.offsetWidth > 0
      );

      // Listen to note events
      noteCard.addEventListener("note-title-changed", (e) => {
        stateManager.updateNote(e.detail.id, { title: e.detail.title });
      });

      noteCard.addEventListener("note-content-changed", (e) => {
        stateManager.updateNote(e.detail.id, { text: e.detail.text });
      });

      noteCard.addEventListener("note-moved", (e) => {
        stateManager.updateNote(e.detail.id, { x: e.detail.x, y: e.detail.y });
        // Re-render connections when notes move
        this.renderConnections();
      });

      noteCard.addEventListener("note-delete-requested", (e) => {
        if (confirm("Delete this note?")) {
          stateManager.deleteNote(e.detail.id);
        }
      });

      noteCard.addEventListener("note-add-child-requested", (e) => {
        this.createChildNote(e.detail.id);
      });

      noteCard.addEventListener("note-deep-dive-requested", (e) => {
        this.deepDiveNote(e.detail.id);
      });

      noteCard.addEventListener("note-toggle-collapse", (e) => {
        this.toggleNoteCollapse(e.detail.id);
      });

      canvas.appendChild(noteCard);
    });

    console.log("✅ Notes rendered! Canvas children:", canvas.children.length);
    console.log("Canvas element info:", {
      width: canvas.offsetWidth,
      height: canvas.offsetHeight,
      transform: canvas.style.transform,
    });

    // Render connections after notes are in DOM
    this.renderConnections();
  }

  /**
   * Render SVG connections between notes
   */
  renderConnections() {
    const svg = this.$("#connectionOverlay");
    if (!svg) return;

    // Clear existing connections
    svg.innerHTML = "";

    const connections = this.state.connections || [];
    console.log("🔗 Rendering", connections.length, "connections");

    connections.forEach((conn) => {
      // Handle both old format (from/to) and new format (sourceId/targetId)
      const sourceId = conn.from || conn.sourceId;
      const targetId = conn.to || conn.targetId;

      const sourceNote = this.$(`.note-card[data-id="${sourceId}"]`);
      const targetNote = this.$(`.note-card[data-id="${targetId}"]`);

      if (!sourceNote || !targetNote) return;

      // Get center points of notes
      const sourceRect = sourceNote.getBoundingClientRect();
      const targetRect = targetNote.getBoundingClientRect();
      const canvasRect = this.$("#canvasContainer").getBoundingClientRect();

      const x1 = sourceRect.left - canvasRect.left + sourceRect.width / 2;
      const y1 = sourceRect.top - canvasRect.top + sourceRect.height / 2;
      const x2 = targetRect.left - canvasRect.left + targetRect.width / 2;
      const y2 = targetRect.top - canvasRect.top + targetRect.height / 2;

      // Create path based on connection type
      const path = this.createConnectionPath(x1, y1, x2, y2, conn.type);
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      line.setAttribute("d", path);

      // Style based on connection type
      this.styleConnection(line, conn);

      // Add tooltip
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title"
      );
      const confidence = conn.confidence
        ? ` (${Math.round(conn.confidence * 100)}%)`
        : "";
      title.textContent = `${conn.type}: ${
        conn.reason || "No reason"
      }${confidence}`;
      line.appendChild(title);

      // Add connection label if it's a semantic connection
      if (conn.reason && conn.type !== "parent-child") {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        label.setAttribute("x", midX);
        label.setAttribute("y", midY - 5);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10px");
        label.setAttribute("font-weight", "600");
        label.setAttribute("fill", style.stroke);
        label.setAttribute("opacity", "0.8");
        label.textContent = conn.type;

        // Add background for label
        const labelBg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        labelBg.setAttribute("x", midX - 20);
        labelBg.setAttribute("y", midY - 15);
        labelBg.setAttribute("width", "40");
        labelBg.setAttribute("height", "12");
        labelBg.setAttribute("fill", "rgba(255,255,255,0.9)");
        labelBg.setAttribute("stroke", style.stroke);
        labelBg.setAttribute("stroke-width", "0.5");
        labelBg.setAttribute("rx", "3");
        labelBg.setAttribute("opacity", "0.8");

        svg.appendChild(labelBg);
        svg.appendChild(label);
      }

      svg.appendChild(line);
    });
  }

  /**
   * Create SVG path for connection
   */
  createConnectionPath(x1, y1, x2, y2, type) {
    if (type === "parent-child") {
      // Straight line from parent to child
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      // Curved line for other connections
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const offset = Math.min(50, Math.sqrt(dx * dx + dy * dy) * 0.2);
      const cx = midX - (dy * offset) / Math.sqrt(dx * dx + dy * dy);
      const cy = midY + (dx * offset) / Math.sqrt(dx * dx + dy * dy);
      return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    }
  }

  /**
   * Apply styles to connection based on type
   */
  styleConnection(line, conn) {
    const type = conn.type || "related";

    const styles = {
      "parent-child": { stroke: "#999", width: 2, dash: "none", opacity: 0.6 },
      similarity: { stroke: "#4CAF50", width: 1.5, dash: "5,5", opacity: 0.5 },
      causal: { stroke: "#2196F3", width: 2.5, dash: "none", opacity: 0.7 },
      contradiction: {
        stroke: "#f44336",
        width: 1.5,
        dash: "3,3",
        opacity: 0.6,
      },
      supports: { stroke: "#4CAF50", width: 2, dash: "none", opacity: 0.6 },
      refines: { stroke: "#9C27B0", width: 1.5, dash: "2,2", opacity: 0.5 },
      temporal: { stroke: "#FF9800", width: 2, dash: "none", opacity: 0.6 },
      related: { stroke: "#757575", width: 1, dash: "5,5", opacity: 0.4 },
    };

    const style = styles[type] || styles.related;

    line.setAttribute("stroke", style.stroke);
    line.setAttribute("stroke-width", style.width);
    line.setAttribute("fill", "none");

    // Use confidence to adjust opacity if available
    const opacity = conn.confidence
      ? Math.max(0.3, Math.min(0.9, conn.confidence * style.opacity))
      : style.opacity;
    line.setAttribute("opacity", opacity);

    if (style.dash !== "none") {
      line.setAttribute("stroke-dasharray", style.dash);
    }

    // Add arrow marker for directed connections
    if (conn.directed) {
      line.setAttribute("marker-end", "url(#arrowhead)");
    }
  }

  createNewNote() {
    const newNote = {
      id: "note_" + Math.random().toString(36).slice(2, 9),
      title: "New Note",
      text: "",
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 300,
      color: this.getRandomNoteColor(),
    };

    stateManager.addNote(newNote);
    this.saveToStorage();
  }

  createChildNote(parentId) {
    const parent = stateManager.getNote(parentId);
    if (!parent) return;

    const childNote = {
      id: "note_" + Math.random().toString(36).slice(2, 9),
      title: "Child Note",
      text: "",
      x: parent.x + 250,
      y: parent.y + 100,
      color: parent.color,
      parentId: parentId,
    };

    stateManager.addNote(childNote);

    // Update parent's hasChildren flag
    stateManager.updateNote(parentId, { hasChildren: true });

    // Add connection
    stateManager.addConnection({
      from: parentId,
      to: childNote.id,
      type: "parent-child",
    });

    this.saveToStorage();
    console.log("✅ Child note created for parent:", parentId);
  }

  async deepDiveNote(noteId) {
    const note = stateManager.getNote(noteId);
    if (!note) return;

    console.log("🔍 Deep Dive requested for:", note.title);

    try {
      const prompt = `Expand this concept into 3-5 specific sub-concepts:

Title: ${note.title || "Untitled"}
Content: ${note.text}

Return JSON array:
[
  { "title": "Sub-concept 1", "text": "Detailed explanation..." },
  { "title": "Sub-concept 2", "text": "Detailed explanation..." },
  ...
]

Each sub-concept should be specific, actionable, and add new information.`;

      const response = await llmService.generate(prompt, { temperature: 0.7 });
      const subconcepts = this.safeParseJSON(response);

      if (!subconcepts || !Array.isArray(subconcepts)) {
        throw new Error("Invalid response format");
      }

      console.log(`✅ Generated ${subconcepts.length} sub-concepts`);

      // Create child notes
      const hierarchy = this.state.noteHierarchy || {};
      if (!hierarchy[noteId]) {
        hierarchy[noteId] = [];
      }

      subconcepts.forEach((sub, index) => {
        const childId = `note_${Date.now()}_${index}`;
        const childNote = {
          id: childId,
          title: sub.title || `Sub-concept ${index + 1}`,
          text: sub.text || "",
          x: note.x + (index % 3) * 250,
          y: note.y + Math.floor(index / 3) * 220 + 220,
          color: note.color,
          parentId: noteId,
        };

        stateManager.addNote(childNote);
        hierarchy[noteId].push(childId);

        // Add parent-child connection
        stateManager.addConnection({
          sourceId: noteId,
          targetId: childId,
          type: "parent-child",
          reason: "Deep dive expansion",
          weight: 1,
          directed: true,
        });
      });

      stateManager.setState({ noteHierarchy: hierarchy });
      alert(`✅ Created ${subconcepts.length} child notes!`);
    } catch (error) {
      console.error("Deep dive error:", error);
      alert(
        `Deep dive failed: ${error.message}\n\nMake sure you have configured an LLM provider.`
      );
    }
  }

  toggleNoteCollapse(noteId) {
    const { collapsedNotes } = this.state;
    if (collapsedNotes.has(noteId)) {
      collapsedNotes.delete(noteId);
    } else {
      collapsedNotes.add(noteId);
    }

    stateManager.setState({ collapsedNotes });
    console.log("🔄 Toggled collapse for note:", noteId);
  }

  getRandomNoteColor() {
    const colors = ["#FFE4B5", "#E6F3FF", "#FFE6E6", "#E6FFE6", "#F0E6FF"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async saveToStorage() {
    try {
      const canvas = {
        id: this.state.currentCanvasId || Date.now(),
        name: this.state.currentCanvasName,
        notes: this.state.notes,
        connections: this.state.connections,
        noteHierarchy: this.state.noteHierarchy || {},
        collapsedNotes: Array.from(this.state.collapsedNotes || new Set()),
        pan: this.state.pan || { x: 0, y: 0 },
        zoom: this.state.zoom || 1,
        timestamp: Date.now(),
      };

      const id = await indexedDBService.saveCanvas(canvas);
      if (!this.state.currentCanvasId) {
        stateManager.setState({ currentCanvasId: id });
      }
      console.log("💾 Canvas auto-saved to IndexedDB:", canvas.name);
    } catch (e) {
      console.error("Failed to save canvas to IndexedDB:", e);
    }
  }

  analyzeNotes() {
    this.publish("analyze-notes-requested");
  }

  openTemplateWizard() {
    const wizard = this.$("#templateWizard");
    if (wizard) {
      wizard.open();
    }
  }

  toggleChatInterface() {
    const chatInterface = this.$("#chatInterface");
    if (chatInterface) {
      chatInterface.toggle();
    }
  }

  createAnalysisScratchNode() {
    const canvasContainer = this.$("#noteCanvas");
    if (!canvasContainer) return;

    // Create the analysis scratch node
    const analysisScratchNode = document.createElement("analysis-scratch-node");

    // Position it in a good location (avoid overlapping with existing notes)
    const position = this.findGoodScratchNodePosition();
    analysisScratchNode.setPosition(position.x, position.y);

    // Add to canvas
    canvasContainer.appendChild(analysisScratchNode);

    console.log("🧠 Analysis scratch node created at", position);
  }

  findGoodScratchNodePosition() {
    const notes = this.state.notes;
    const canvasContainer = this.$("#noteCanvas");

    if (!canvasContainer || notes.length === 0) {
      // Default position if no notes
      return { x: 100, y: 100 };
    }

    // Find a position that doesn't overlap with existing notes
    const containerRect = canvasContainer.getBoundingClientRect();
    const notePositions = notes.map((note) => ({ x: note.x, y: note.y }));

    // Try positions in a grid pattern
    for (let y = 50; y < containerRect.height - 250; y += 150) {
      for (let x = 50; x < containerRect.width - 350; x += 200) {
        const position = { x, y };

        // Check if this position overlaps with any note (assuming 200x150 note size)
        const overlaps = notePositions.some((notePos) => {
          return (
            Math.abs(position.x - notePos.x) < 250 &&
            Math.abs(position.y - notePos.y) < 200
          );
        });

        if (!overlaps) {
          return position;
        }
      }
    }

    // Fallback: place at a random position
    return {
      x: Math.random() * (containerRect.width - 350),
      y: Math.random() * (containerRect.height - 250),
    };
  }

  toggleTheme() {
    themeService.toggleTheme();
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const themeFab = this.$("#themeFab");
    if (themeFab) {
      const icon = themeFab.querySelector(".material-icons");
      if (icon) {
        const currentTheme = themeService.getCurrentTheme();
        icon.textContent = currentTheme === "dark" ? "dark_mode" : "light_mode";
        themeFab.title = `Switch to ${
          currentTheme === "dark" ? "Light" : "Dark"
        } Theme`;
      }
    }
  }

  onThemeChange(theme) {
    // Just update the theme icon - CSS variables are inherited from document
    this.updateThemeIcon();
    console.log("🎨 NeuroApp theme changed to:", theme);
  }

  toggleLeftDrawer() {
    const drawer = this.$("#leftDrawer");
    const overlay = this.$("#drawerOverlay");
    const isOpen = drawer.classList.contains("open");

    if (isOpen) {
      drawer.classList.remove("open");
      overlay.classList.remove("show");
      stateManager.setState({ leftDrawerOpen: false });
    } else {
      drawer.classList.add("open");
      overlay.classList.add("show");
      stateManager.setState({ leftDrawerOpen: true });
      // Refresh canvas list when opening
      this.refreshCanvasList();
      // Close right drawer if open
      this.$("#rightDrawer").classList.remove("open");
      stateManager.setState({ rightDrawerOpen: false });
    }
    console.log("🍔 Left drawer:", isOpen ? "CLOSED" : "OPEN");
  }

  toggleRightDrawer() {
    const drawer = this.$("#rightDrawer");
    const overlay = this.$("#drawerOverlay");
    const isOpen = drawer.classList.contains("open");

    if (isOpen) {
      drawer.classList.remove("open");
      overlay.classList.remove("show");
      stateManager.setState({ rightDrawerOpen: false });
    } else {
      drawer.classList.add("open");
      overlay.classList.add("show");
      stateManager.setState({ rightDrawerOpen: true });
      // Close left drawer if open
      this.$("#leftDrawer").classList.remove("open");
      stateManager.setState({ leftDrawerOpen: false });
    }
    console.log("⚙️ Right drawer:", isOpen ? "CLOSED" : "OPEN");
  }

  attachDrawerListeners() {
    // Close buttons
    this.$("#closeLeftDrawer")?.addEventListener("click", () => {
      this.$("#leftDrawer").classList.remove("open");
      this.$("#drawerOverlay").classList.remove("show");
      stateManager.setState({ leftDrawerOpen: false });
    });

    this.$("#closeRightDrawer")?.addEventListener("click", () => {
      this.$("#rightDrawer").classList.remove("open");
      this.$("#drawerOverlay").classList.remove("show");
      stateManager.setState({ rightDrawerOpen: false });
    });

    // Overlay click to close both
    this.$("#drawerOverlay")?.addEventListener("click", () => {
      this.$("#leftDrawer").classList.remove("open");
      this.$("#rightDrawer").classList.remove("open");
      this.$("#drawerOverlay").classList.remove("show");
      stateManager.setState({
        leftDrawerOpen: false,
        rightDrawerOpen: false,
      });
    });

    // New Canvas button
    this.$("#newCanvasBtn")?.addEventListener("click", () => {
      this.createNewCanvas();
    });

    // Provider selection change
    this.$("#llmProvider")?.addEventListener("change", async (e) => {
      const provider = e.target.value;
      await this.updateProviderUI(provider);
    });

    // Refresh Models button
    this.$("#refreshModelsBtn")?.addEventListener("click", async () => {
      const provider = this.$("#llmProvider").value;
      const btn = this.$("#refreshModelsBtn");
      const icon = btn.querySelector(".material-icons");

      // Show loading animation
      icon.style.animation = "spin 1s linear infinite";
      btn.disabled = true;

      try {
        await this.updateProviderUI(provider);
        console.log(`🔄 Refreshed models for ${provider}`);
      } catch (error) {
        console.error("Failed to refresh models:", error);
        alert("Failed to refresh models. Check console for details.");
      } finally {
        icon.style.animation = "";
        btn.disabled = false;
      }
    });

    // Load WebLLM Model button
    this.$("#loadWebLLMBtn")?.addEventListener("click", async () => {
      const model = this.$("#llmModel").value;
      const btn = this.$("#loadWebLLMBtn");
      const progress = this.$("#webllmProgress");
      const progressBar = this.$("#webllmProgressBar");
      const progressText = this.$("#webllmProgressText");

      try {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        progress.style.display = "block";
        progressBar.style.width = "0%";
        progressText.textContent = "Initializing WebLLM...";

        // Initialize WebLLM with progress callback
        const success = await llmService.initWebLLM((report) => {
          console.log("WebLLM progress:", report);
          if (report.progress) {
            const percent = Math.round(report.progress * 100);
            progressBar.style.width = percent + "%";
            progressText.textContent =
              report.text || `Loading model... ${percent}%`;
          }
        });

        if (success) {
          progressBar.style.width = "100%";
          progressText.textContent = "✅ Model loaded successfully!";
          setTimeout(() => {
            progress.style.display = "none";
            btn.textContent = "✅ Model Loaded";
            btn.style.background = "#28a745";
          }, 1500);
          alert(
            "🎉 WebLLM model loaded successfully! You can now use AI features."
          );
        } else {
          throw new Error("Failed to initialize WebLLM");
        }
      } catch (error) {
        console.error("WebLLM loading error:", error);
        progressText.textContent = "❌ Error: " + error.message;
        alert("Failed to load WebLLM model. Check console for details.");
      } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    });

    // Save Settings button
    this.$("#saveSettingsBtn")?.addEventListener("click", () => {
      const provider = this.$("#llmProvider").value;
      const model = this.$("#llmModel").value;
      const apiKey = this.$("#llmApiKey").value;
      const endpoint = this.$("#llmEndpoint").value;
      const temperature = parseFloat(this.$("#llmTemp").value);

      console.log("💾 Saving LLM settings:", {
        provider,
        model,
        apiKey: apiKey ? "***" : "(not set)",
        endpoint,
        temperature,
      });

      // Update LLM service config
      llmService.updateConfig({
        provider,
        model,
        apiKey,
        endpoint,
        temperature,
      });

      alert("Settings saved successfully!");
      this.toggleRightDrawer();
    });

    // Temperature slider live update
    this.$("#llmTemp")?.addEventListener("input", (e) => {
      this.$("#tempValue").textContent = e.target.value;
    });

    // Initialize provider UI on load
    setTimeout(async () => {
      const provider = this.$("#llmProvider").value;
      await this.updateProviderUI(provider);

      // Load saved config
      const config = llmService.config;
      if (config.provider) {
        this.$("#llmProvider").value = config.provider;
        this.updateProviderUI(config.provider);
      }
      if (config.model) {
        this.$("#llmModel").value = config.model;
      }
      if (config.apiKey) {
        this.$("#llmApiKey").value = config.apiKey;
      }
      if (config.endpoint) {
        this.$("#llmEndpoint").value = config.endpoint;
      }
      if (config.temperature) {
        this.$("#llmTemp").value = config.temperature;
        this.$("#tempValue").textContent = config.temperature;
      }
    }, 100);
  }

  async updateProviderUI(provider) {
    const apiKeyLabel = this.$("#apiKeyLabel");
    const endpointLabel = this.$("#endpointLabel");
    const apiKeyInput = this.$("#llmApiKey");
    const endpointInput = this.$("#llmEndpoint");
    const modelSelect = this.$("#llmModel");
    const webllmControls = this.$("#webllmControls");

    // Reset visibility
    webllmControls.style.display = "none";
    apiKeyInput.style.display = "block";
    endpointInput.style.display = "block";

    // Show loading state
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    modelSelect.disabled = true;

    // Fetch models dynamically from provider API with fallback
    const models = await llmService.fetchProviderModels(provider);

    // Re-enable dropdown
    modelSelect.disabled = false;

    // Populate model dropdown
    modelSelect.innerHTML = '<option value="">Select a model...</option>';
    models.forEach((model) => {
      const option = document.createElement("option");
      // Handle both object {id, name} and string formats
      if (typeof model === "object") {
        option.value = model.id;
        option.textContent = model.name;
      } else {
        option.value = model;
        option.textContent = model;
      }
      modelSelect.appendChild(option);
    });

    // Provider-specific UI updates
    if (provider === "webllm") {
      apiKeyLabel.textContent = "(not needed for WebLLM)";
      apiKeyInput.style.display = "none";
      endpointLabel.textContent = "(not needed for WebLLM)";
      endpointInput.style.display = "none";
      webllmControls.style.display = "block";

      // Set default model if available
      if (models.length > 0) {
        const firstModel = models[0];
        modelSelect.value =
          typeof firstModel === "object" ? firstModel.id : firstModel;
      }
    } else if (provider === "openai") {
      apiKeyLabel.textContent = "(required for OpenAI)";
      apiKeyInput.style.display = "block";
      endpointLabel.textContent = "(optional, defaults to OpenAI API)";
      endpointInput.style.display = "block";

      // Default to gpt-4o-mini if available
      const defaultModel =
        models.find((m) => {
          const modelId = typeof m === "object" ? m.id : m;
          return modelId === "gpt-4o-mini";
        }) || models[0];

      if (defaultModel) {
        modelSelect.value =
          typeof defaultModel === "object" ? defaultModel.id : defaultModel;
      }
    } else if (provider === "anthropic") {
      apiKeyLabel.textContent = "(required for Claude)";
      apiKeyInput.style.display = "block";
      endpointLabel.textContent = "(optional)";
      endpointInput.style.display = "none";

      // Default to latest sonnet if available
      const defaultModel =
        models.find((m) => {
          const modelId = typeof m === "object" ? m.id : m;
          return modelId.includes("sonnet");
        }) || models[0];

      if (defaultModel) {
        modelSelect.value =
          typeof defaultModel === "object" ? defaultModel.id : defaultModel;
      }
    } else if (provider === "ollama") {
      apiKeyLabel.textContent = "(not needed for Ollama)";
      apiKeyInput.style.display = "none";
      endpointLabel.textContent = "(required for Ollama)";
      endpointInput.style.display = "block";
      endpointInput.value = "http://localhost:11434";

      // Default to llama3.2 if available
      const defaultModel =
        models.find((m) => {
          const modelId = typeof m === "object" ? m.id : m;
          return modelId.includes("llama3.2");
        }) || models[0];

      if (defaultModel) {
        modelSelect.value =
          typeof defaultModel === "object" ? defaultModel.id : defaultModel;
      }
    }

    console.log(`📋 Loaded ${models.length} models for ${provider}:`, models);
  }

  updateHeader() {
    const header = this.$("#header");
    if (header) {
      header.setCanvasName(this.state.currentCanvasName);
      header.setDirty(this.state.isDirty);
    }
  }

  async loadLastCanvas() {
    console.log("Loading last canvas...");

    try {
      // Check if we have any canvases in IndexedDB
      const canvases = await indexedDBService.loadCanvases();

      if (canvases.length === 0) {
        // No canvases exist - create an Examples canvas
        console.log("No canvases found, creating Examples canvas...");
        await this.createExamplesCanvas();
        return;
      }

      // Try to load the most recent canvas
      const lastCanvas = canvases.sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      )[0];

      if (lastCanvas) {
        stateManager.setState({
          notes: lastCanvas.notes || [],
          connections: lastCanvas.connections || [],
          noteHierarchy: lastCanvas.noteHierarchy || {},
          collapsedNotes: new Set(lastCanvas.collapsedNotes || []),
          pan: lastCanvas.pan || { x: 0, y: 0 },
          zoom: lastCanvas.zoom || 1,
          currentCanvasId: lastCanvas.id,
          currentCanvasName: lastCanvas.name || "Untitled Canvas",
        });
        console.log("✅ Loaded last canvas:", lastCanvas.name);
        return;
      }
    } catch (e) {
      console.error("Failed to load from IndexedDB:", e);
    }

    // Fallback: create examples if nothing worked
    await this.createExamplesCanvas();
  }

  /**
   * Create an Examples canvas with rich sample content
   */
  async createExamplesCanvas() {
    const sampleNotes = [
      // Main concept and core ideas
      {
        id: "note_big_idea",
        title: "Big Idea 💡",
        text: "Semantic sticky notes with LLM integration for intelligent knowledge organization and idea exploration",
        x: 120,
        y: 120,
        color: "#FFE4B5", // yellow
      },
      {
        id: "note_exploration",
        title: "Exploration 🔍",
        text: "Cluster notes by semantic themes and discover hidden relationships between ideas using AI analysis",
        x: 400,
        y: 160,
        color: "#FFB6C1", // pink
      },
      {
        id: "note_dataset",
        title: "Dataset 📊",
        text: "Transform your personal notes into a searchable knowledge base with semantic understanding and contextual connections",
        x: 720,
        y: 200,
        color: "#FFE4B5", // yellow
      },

      // Technical aspects
      {
        id: "note_privacy",
        title: "Privacy 🔒",
        text: "Local WebLLM models reduce data exposure while maintaining powerful AI capabilities entirely in your browser",
        x: 220,
        y: 360,
        color: "#B0E0E6", // teal
      },
      {
        id: "note_timeline",
        title: "Timeline ⏰",
        text: "Track the evolution of your ideas over time and see how concepts develop and interconnect",
        x: 860,
        y: 380,
        color: "#B0E0E6", // teal
      },

      // Workflow and automation
      {
        id: "note_workflow",
        title: "Workflow 🔄",
        text: "Automatically generate tasks and action items from note clusters using intelligent pattern recognition",
        x: 520,
        y: 420,
        color: "#DDA0DD", // purple
      },
      {
        id: "note_ux",
        title: "UX Design 🎨",
        text: "Interactive mind-map interface with curved connections, drag-and-drop, and visual clustering for intuitive navigation",
        x: 160,
        y: 520,
        color: "#DDA0DD", // purple
      },

      // Analysis and insights
      {
        id: "note_contradictions",
        title: "Contradictions ⚡",
        text: "Automatically detect conflicting ideas and highlight areas where your thinking might need reconciliation",
        x: 320,
        y: 520,
        color: "#FFB6C1", // pink
      },
      {
        id: "note_evaluation",
        title: "Evaluation 📈",
        text: "Assign confidence scores and weights to connections, allowing for nuanced understanding of relationship strength",
        x: 640,
        y: 520,
        color: "#FFE4B5", // yellow
      },

      // Getting started guide
      {
        id: "note_welcome",
        title: "Welcome to NeuroNotes! �",
        text: "🚀 Try these features:\n• Drag notes around\n• Edit titles and content\n• Click 'Analyze' to find connections\n• Use 'Deep Dive' to expand ideas\n• Try 'Templates' for document generation\n• 'Beautify' to auto-arrange notes",
        x: 50,
        y: 50,
        color: "#98FB98", // light green
      },
    ];

    sampleNotes.forEach((note) => stateManager.addNote(note));

    // Add some sample connections to show relationships
    const sampleConnections = [
      {
        id: "conn_1",
        sourceId: "note_big_idea",
        targetId: "note_exploration",
        type: "related",
        reason: "Both focus on semantic understanding of ideas",
        weight: 0.8,
        directed: false,
      },
      {
        id: "conn_2",
        sourceId: "note_exploration",
        targetId: "note_dataset",
        type: "supports",
        reason: "Exploration creates the dataset for knowledge organization",
        weight: 0.9,
        directed: true,
      },
      {
        id: "conn_3",
        sourceId: "note_privacy",
        targetId: "note_big_idea",
        type: "supports",
        reason: "Privacy concerns support the local LLM approach",
        weight: 0.7,
        directed: true,
      },
      {
        id: "conn_4",
        sourceId: "note_workflow",
        targetId: "note_contradictions",
        type: "related",
        reason: "Both involve automated analysis of note content",
        weight: 0.6,
        directed: false,
      },
    ];

    // Create the Examples canvas
    const examplesCanvas = {
      id: Date.now(),
      name: "🎨 Examples & Getting Started",
      notes: sampleNotes,
      connections: sampleConnections,
      noteHierarchy: {},
      collapsedNotes: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
      timestamp: Date.now(),
    };

    try {
      // Save Examples canvas to IndexedDB
      const canvasId = await indexedDBService.saveCanvas(examplesCanvas);

      // Load the Examples canvas
      stateManager.setState({
        currentCanvasId: canvasId,
        currentCanvasName: examplesCanvas.name,
        notes: sampleNotes,
        connections: sampleConnections,
        noteHierarchy: {},
        collapsedNotes: new Set(),
        pan: { x: 0, y: 0 },
        zoom: 1,
      });

      console.log("✅ Created and loaded Examples canvas");

      // Refresh the canvas list so it appears in the left drawer
      this.refreshCanvasList();
    } catch (error) {
      console.error("Failed to create Examples canvas:", error);

      // Fallback: just add notes to current state without saving
      sampleNotes.forEach((note) => stateManager.addNote(note));
      sampleConnections.forEach((conn) => stateManager.addConnection(conn));
    }
  }

  /**
   * Analyze notes with LLM to discover semantic connections
   */
  async analyzeNotesWithLLM() {
    console.log("🔍 Starting semantic analysis...");

    const notes = this.state.notes;
    if (notes.length < 2) {
      alert("Need at least 2 notes to analyze connections");
      return;
    }

    // Show loading state
    const header = this.$("#header");
    if (header) {
      const analyzeBtn = header.shadowRoot.querySelector("#analyzeBtn");
      if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing...";
      }
    }

    try {
      const systemPrompt =
        "You are a rigorous graph-building assistant. Return strict JSON only.";
      const userPrompt = `
You are given user notes. Build a semantic graph that captures clusters and multiple relationships between the notes.

Requirements:
- Return STRICT JSON (no markdown, no preface).
- Schema:
{
  "clusters": [
    { "theme": "string", "notes": ["note_id", ...], "summary": "string optional" }
  ],
  "connections": [
    {
      "sourceId": "note_id",
      "targetId": "note_id",
      "type": "similarity|causal|contradiction|supports|refines|temporal|related",
      "reason": "short explanation",
      "weight": 0.0-1.0,
      "confidence": 0.0-1.0,
      "directed": true|false
    }
  ]
}
- Allow MULTIPLE connections between the same pair.
- "weight": strength of relation; "confidence": confidence in reasoning.

Notes:
${JSON.stringify(
  notes.map((n) => ({ id: n.id, title: n.title, text: n.text })),
  null,
  2
)}
      `.trim();

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const response = await llmService.generate(fullPrompt, {
        temperature: 0.2,
      });

      console.log("📊 LLM Response:", response);

      // Parse JSON response
      const result = this.safeParseJSON(response);

      if (result && result.connections) {
        console.log(`✅ Found ${result.connections.length} connections`);

        // Add new connections to state (merge with existing)
        const existingConnections = this.state.connections || [];
        const newConnections = result.connections.filter((newConn) => {
          // Check if connection already exists
          return !existingConnections.some(
            (existing) =>
              existing.sourceId === newConn.sourceId &&
              existing.targetId === newConn.targetId &&
              existing.type === newConn.type
          );
        });

        stateManager.setState({
          connections: [...existingConnections, ...newConnections],
        });

        alert(
          `Analysis complete! Added ${newConnections.length} new connections.`
        );
      } else {
        console.warn("No connections found in response");
        alert("Analysis complete but no connections discovered.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert(
        `Analysis failed: ${error.message}\n\nMake sure you have configured an LLM provider in the right drawer.`
      );
    } finally {
      // Restore button state
      const header = this.$("#header");
      if (header) {
        const analyzeBtn = header.shadowRoot.querySelector("#analyzeBtn");
        if (analyzeBtn) {
          analyzeBtn.disabled = false;
          analyzeBtn.innerHTML =
            '<span class="material-icons">auto_awesome</span> Analyze';
        }
      }
    }
  }

  /**
   * Safe JSON parsing with fallback
   */
  safeParseJSON(text) {
    try {
      // Try direct parse
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error("Failed to parse JSON from code block:", e2);
        }
      }

      // Try to find JSON object
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch (e3) {
          console.error("Failed to extract JSON:", e3);
        }
      }
    }
    return null;
  }

  /**
   * Load canvases from IndexedDB and populate left drawer
   */
  async refreshCanvasList() {
    const canvasList = this.$("#canvasList");
    if (!canvasList) return;

    try {
      const canvases = await indexedDBService.loadCanvases();

      canvasList.innerHTML = "";

      if (canvases.length === 0) {
        canvasList.innerHTML =
          '<div style="padding: 20px; text-align: center; color: #999;">No saved canvases yet</div>';
        return;
      }

      canvases.forEach((canvas) => {
        const item = document.createElement("div");
        item.className = "canvas-item";
        if (canvas.id === this.state.currentCanvasId) {
          item.classList.add("active");
        }

        const timestamp = new Date(canvas.timestamp).toLocaleString();
        item.innerHTML = `
          <div style="flex: 1;">
            <div style="font-weight: 500;">${canvas.name || "Untitled"}</div>
            <div style="font-size: 0.75rem; color: #888;">${timestamp}</div>
            <div style="font-size: 0.75rem; color: #666;">${
              canvas.notes?.length || 0
            } notes</div>
          </div>
          ${
            canvas.id === this.state.currentCanvasId
              ? '<span class="material-icons" style="color: #4CAF50;">check_circle</span>'
              : ""
          }
        `;

        item.addEventListener("click", () => this.loadCanvasById(canvas.id));
        canvasList.appendChild(item);
      });
    } catch (error) {
      console.error("Failed to load canvases:", error);
      canvasList.innerHTML =
        '<div style="padding: 20px; text-align: center; color: #f44336;">Failed to load canvases</div>';
    }
  }

  /**
   * Load a specific canvas by ID
   */
  async loadCanvasById(id) {
    try {
      const canvas = await indexedDBService.loadCanvas(id);
      if (canvas) {
        stateManager.setState({
          currentCanvasId: canvas.id,
          currentCanvasName: canvas.name,
          notes: canvas.notes || [],
          connections: canvas.connections || [],
          noteHierarchy: canvas.noteHierarchy || {},
          collapsedNotes: new Set(canvas.collapsedNotes || []),
          pan: canvas.pan || { x: 0, y: 0 },
          zoom: canvas.zoom || 1,
        });

        this.toggleLeftDrawer(); // Close drawer
        console.log("✅ Loaded canvas:", canvas.name);
      }
    } catch (error) {
      console.error("Failed to load canvas:", error);
      alert("Failed to load canvas");
    }
  }

  /**
   * Create a new blank canvas
   */
  async createNewCanvas() {
    const canvasName = prompt("Enter canvas name:", "Untitled Canvas");
    if (!canvasName) return;

    const newCanvas = {
      id: Date.now(),
      name: canvasName,
      notes: [],
      connections: [],
      noteHierarchy: {},
      collapsedNotes: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
      timestamp: Date.now(),
    };

    try {
      const id = await indexedDBService.saveCanvas(newCanvas);
      stateManager.setState({
        currentCanvasId: id,
        currentCanvasName: canvasName,
        notes: [],
        connections: [],
        noteHierarchy: {},
        collapsedNotes: new Set(),
        pan: { x: 0, y: 0 },
        zoom: 1,
      });

      this.toggleLeftDrawer();
      console.log("✅ Created new canvas:", canvasName);
    } catch (error) {
      console.error("Failed to create canvas:", error);
      alert("Failed to create canvas");
    }
  }

  /**
   * Force-directed layout (Beautify)
   */
  async beautifyLayout() {
    console.log("🎨 Applying force-directed layout...");

    const notes = [...this.state.notes];
    const connections = this.state.connections || [];

    if (notes.length < 2) {
      alert("Need at least 2 notes for auto-layout");
      return;
    }

    // Physics parameters
    const springLength = 200;
    const springStrength = 0.02;
    const repulsionRadius = 300;
    const repulsionStrength = 8000;
    const centerStrength = 0.001;
    const damping = 0.85;
    const iterations = 150;

    // Initialize velocities
    notes.forEach((n) => {
      n.vx = 0;
      n.vy = 0;
    });

    // Simulation loop
    for (let iter = 0; iter < iterations; iter++) {
      // Reset forces
      notes.forEach((n) => {
        n.fx = 0;
        n.fy = 0;
      });

      // Repulsion between all notes
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const dx = notes[j].x - notes[i].x;
          const dy = notes[j].y - notes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < repulsionRadius) {
            const force = repulsionStrength / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            notes[i].fx -= fx;
            notes[i].fy -= fy;
            notes[j].fx += fx;
            notes[j].fy += fy;
          }
        }
      }

      // Spring attraction for connected notes
      connections.forEach((conn) => {
        const source = notes.find((n) => n.id === conn.sourceId);
        const target = notes.find((n) => n.id === conn.targetId);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.fx += fx;
        source.fy += fy;
        target.fx -= fx;
        target.fy -= fy;
      });

      // Center gravity
      const centerX = 800;
      const centerY = 400;
      notes.forEach((n) => {
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.fx += dx * centerStrength;
        n.fy += dy * centerStrength;
      });

      // Update positions
      notes.forEach((n) => {
        n.vx = (n.vx + n.fx) * damping;
        n.vy = (n.vy + n.fy) * damping;
        n.x += n.vx;
        n.y += n.vy;

        // Keep within bounds
        n.x = Math.max(50, Math.min(1800, n.x));
        n.y = Math.max(50, Math.min(1200, n.y));
      });
    }

    // Clean up velocity properties and update state
    notes.forEach((n) => {
      delete n.vx;
      delete n.vy;
      delete n.fx;
      delete n.fy;
    });

    stateManager.setState({ notes });
    console.log("✅ Layout complete!");
  }

  /**
   * Show export menu
   */
  showExportMenu() {
    const choice = prompt(
      "Export options:\n1. Markdown\n2. Copy to Clipboard\n\nEnter 1 or 2:"
    );

    if (choice === "1") {
      this.exportToMarkdown();
    } else if (choice === "2") {
      this.copyToClipboard();
    }
  }

  /**
   * Export canvas to Markdown
   */
  exportToMarkdown() {
    const canvas = this.state;
    let md = `# ${canvas.currentCanvasName}\n\n`;

    // Add notes
    canvas.notes.forEach((note) => {
      md += `## ${note.title || "Untitled"}\n\n`;
      md += `${note.text}\n\n`;

      // Add children if any
      const children = canvas.noteHierarchy?.[note.id] || [];
      if (children.length > 0) {
        md += `**Child Notes:**\n`;
        children.forEach((childId) => {
          const child = canvas.notes.find((n) => n.id === childId);
          if (child) {
            md += `- ${child.title || "Untitled"}: ${child.text.substring(
              0,
              100
            )}${child.text.length > 100 ? "..." : ""}\n`;
          }
        });
        md += "\n";
      }
    });

    // Add connections
    if (canvas.connections && canvas.connections.length > 0) {
      md += `\n---\n\n## Connections\n\n`;
      canvas.connections.forEach((conn) => {
        const source = canvas.notes.find((n) => n.id === conn.sourceId);
        const target = canvas.notes.find((n) => n.id === conn.targetId);
        if (source && target) {
          const arrow = conn.directed ? "→" : "↔";
          md += `- ${source.title} ${arrow} ${target.title} (${conn.type}): ${
            conn.reason || "No reason"
          }\n`;
        }
      });
    }

    // Download
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${canvas.currentCanvasName.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);

    console.log("📄 Exported to Markdown");
  }

  /**
   * Copy canvas to clipboard
   */
  async copyToClipboard() {
    const canvas = this.state;
    let text = `${canvas.currentCanvasName}\n\n`;

    canvas.notes.forEach((note) => {
      text += `${note.title || "Untitled"}\n${note.text}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard");
    }
  }
}

customElements.define('neuro-app', NeuroApp);
