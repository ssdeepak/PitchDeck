import { BaseComponent } from '../utils/base-component.js';
import { stateManager } from '../services/state-manager.js';
import { indexedDBService } from "../services/indexeddb-service.js";
import { llmService } from "../services/llm-service.js";
import "./neuro-header.js";
import "./neuro-hamburger.js";
import "./neuro-note-card.js";
import "./template-wizard.js";

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

    // Load last canvas or create sample notes
    this.loadLastCanvas();
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
          background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
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
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.2);
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

              <label>Model</label>
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
      this.analyzeNotesWithLLM()
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

    // Canvas pan/zoom
    this.setupCanvasInteraction();
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
      if (e.target === container) {
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        startPanX = this.state.pan.x;
        startPanY = this.state.pan.y;
        container.style.cursor = "grabbing";
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
        container.style.cursor = "";
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
      const sourceNote = this.$(`.note-card[data-id="${conn.sourceId}"]`);
      const targetNote = this.$(`.note-card[data-id="${conn.targetId}"]`);

      if (!sourceNote || !targetNote) return;

      // Get center points of notes
      const sourceRect = sourceNote.getBoundingClientRect();
      const targetRect = targetNote.getBoundingClientRect();
      const canvasRect = this.$("#canvas-container").getBoundingClientRect();

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
      title.textContent = `${conn.type}: ${conn.reason || "No reason"}`;
      line.appendChild(title);

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
    line.setAttribute("opacity", style.opacity);

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
    this.$("#llmProvider")?.addEventListener("change", (e) => {
      const provider = e.target.value;
      this.updateProviderUI(provider);
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
    setTimeout(() => {
      const provider = this.$("#llmProvider").value;
      this.updateProviderUI(provider);

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

  updateProviderUI(provider) {
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

    // Get models for this provider dynamically
    const models = llmService.getProviderModels(provider);
    
    // Populate model dropdown
    modelSelect.innerHTML = '<option value="">Select a model...</option>';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
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
        modelSelect.value = models[0];
      }
    } else if (provider === "openai") {
      apiKeyLabel.textContent = "(required for OpenAI)";
      apiKeyInput.style.display = "block";
      endpointLabel.textContent = "(optional, defaults to OpenAI API)";
      endpointInput.style.display = "block";
      
      // Default to gpt-4o-mini if available
      const defaultModel = models.find(m => m === 'gpt-4o-mini') || models[0];
      if (defaultModel) modelSelect.value = defaultModel;
    } else if (provider === "anthropic") {
      apiKeyLabel.textContent = "(required for Claude)";
      apiKeyInput.style.display = "block";
      endpointLabel.textContent = "(optional)";
      endpointInput.style.display = "none";
      
      // Default to latest sonnet if available
      const defaultModel = models.find(m => m.includes('sonnet')) || models[0];
      if (defaultModel) modelSelect.value = defaultModel;
    } else if (provider === "ollama") {
      apiKeyLabel.textContent = "(not needed for Ollama)";
      apiKeyInput.style.display = "none";
      endpointLabel.textContent = "(required for Ollama)";
      endpointInput.style.display = "block";
      endpointInput.value = "http://localhost:11434";
      
      // Default to llama3.2 if available
      const defaultModel = models.find(m => m.includes('llama3.2')) || models[0];
      if (defaultModel) modelSelect.value = defaultModel;
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
      // Try to load from localStorage
      const saved = localStorage.getItem("neuronotes_current_canvas");

      if (saved) {
        const canvas = JSON.parse(saved);
        stateManager.setState({
          notes: canvas.notes || [],
          connections: canvas.connections || [],
          noteHierarchy: canvas.noteHierarchy || {},
          collapsedNotes: new Set(canvas.collapsedNotes || []),
          pan: canvas.pan || { x: 0, y: 0 },
          zoom: canvas.zoom || 1,
          currentCanvasId: canvas.id,
          currentCanvasName: canvas.name || "Untitled Canvas",
        });
        console.log("✅ Loaded canvas from storage:", canvas.name);
        return;
      }
    } catch (e) {
      console.error("Failed to load canvas:", e);
    }

    // Create sample notes if none exist
    if (this.state.notes.length === 0) {
      const sampleNotes = [
        {
          id: "note_welcome",
          title: "Welcome to NeuroNotes! 🎉",
          text: 'This is a modular web components version. Try dragging me around, editing text, or clicking "New Note" to add more!',
          x: 100,
          y: 100,
          color: "#FFE4B5",
        },
        {
          id: "note_features",
          title: "Features ✨",
          text: "✅ Drag notes to move\n✅ Edit title and content\n✅ Resize notes\n✅ Add child notes\n✅ Delete notes\n🚧 Deep dive (coming soon)\n🚧 LLM integration",
          x: 450,
          y: 100,
          color: "#E6F3FF",
        },
        {
          id: "note_architecture",
          title: "Architecture 🏗️",
          text: "Built with:\n• Native Web Components\n• Shadow DOM\n• ES6 Modules\n• State Management\n• Event Bus\n• Auto-save",
          x: 100,
          y: 350,
          color: "#E6FFE6",
        },
      ];

      sampleNotes.forEach((note) => stateManager.addNote(note));
      this.saveToStorage();
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
