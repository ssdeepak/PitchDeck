import { BaseComponent } from '../utils/base-component.js';

/**
 * NeuroNoteCard Component
 * Individual sticky note with title, content, and actions
 */
export class NeuroNoteCard extends BaseComponent {
  constructor() {
    super();
    this._noteData = {
      id: "",
      title: "",
      text: "",
      x: 0,
      y: 0,
      color: "#FFE4B5",
      hasChildren: false,
      isCollapsed: false,
    };
  }

  static get observedAttributes() {
    return ["note-id", "note-data"];
  }

  connectedCallback() {
    // Don't call render() yet - wait for setNoteData
    // Only attach event listeners after render
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === "note-data" && newValue) {
      try {
        this._noteData = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error("Invalid note data:", e);
      }
    }
  }

  render() {
    const { id, title, text, x, y, color, hasChildren, isCollapsed } =
      this._noteData;
    
    console.log('🎨 Rendering note card:', id, `at position (${x}, ${y})`);

    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          display: block;
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: 250px;
          height: 200px;
          z-index: 1;
        }

        .note {
          width: 100%;
          height: 100%;
          background: ${color};
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          box-shadow: var(--shadow-sm);
          padding: 12px;
          cursor: move;
          resize: both;
          overflow: auto;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .note:hover {
          box-shadow: var(--shadow-md);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 8px;
        }

        .note-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          background: transparent;
          outline: none;
          padding: 4px;
          max-width:100px;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .note-title:focus {
          border-bottom-color: var(--border-focus);
        }

        .note-actions {
          display: flex;
          gap: 4px;
        }

        .note-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .note-btn:hover {
          background: var(--hover-bg);
        }

        .note-btn .material-icons {
          font-size: 18px;
          color: var(--text-primary);
        }

        .note-content {
          width: 100%;
          min-height: 80px;
          border: none;
          background: transparent;
          resize: none;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.4;
          outline: none;
          padding: 4px;
        }

        .note-footer {
          margin-top: 8px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .note-badge {
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .note-badge .material-icons {
          font-size: 14px;
        }

        .resize-handle {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%);
          cursor: nwse-resize;
          pointer-events: none;
        }
      </style>

      <div class="note" data-note-id="${id}">
        <div class="note-header">
          <input 
            type="text" 
            class="note-title" 
            value="${title}" 
            placeholder="Note title..."
          />
          <div class="note-actions">
            ${
              hasChildren
                ? `
              <button class="note-btn expand-btn" title="${
                isCollapsed ? "Expand" : "Collapse"
              }">
                <span class="material-icons">${
                  isCollapsed ? "expand_more" : "expand_less"
                }</span>
              </button>
            `
                : ""
            }
            <button class="note-btn add-child-btn" title="Add Child Note">
              <span class="material-icons">add</span>
            </button>
            <button class="note-btn deep-dive-btn" title="Deep Dive">
              <span class="material-icons">explore</span>
            </button>
            <button class="note-btn delete-btn" title="Delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        
        <textarea 
          class="note-content" 
          placeholder="Type your note here..."
        >${text}</textarea>

        <div class="note-footer">
          ${
            hasChildren
              ? `
            <div class="note-badge">
              <span class="material-icons">account_tree</span>
              <span>Has children</span>
            </div>
          `
              : ""
          }
        </div>

        <div class="resize-handle"></div>
      </div>
    `;
  }

  attachEventListeners() {
    const note = this.$(".note");
    const titleInput = this.$(".note-title");
    const contentArea = this.$(".note-content");
    const deleteBtn = this.$(".delete-btn");
    const addChildBtn = this.$(".add-child-btn");
    const deepDiveBtn = this.$(".deep-dive-btn");
    const expandBtn = this.$(".expand-btn");

    // Drag handlers
    let isDragging = false;
    let startX, startY, offsetX, offsetY;

    note.addEventListener("mousedown", (e) => {
      if (e.target === titleInput || e.target === contentArea) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      offsetX = this._noteData.x;
      offsetY = this._noteData.y;
      note.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this._noteData.x = offsetX + dx;
      this._noteData.y = offsetY + dy;
      this.style.left = this._noteData.x + "px";
      this.style.top = this._noteData.y + "px";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        note.style.cursor = "move";
        this.emit("note-moved", {
          id: this._noteData.id,
          x: this._noteData.x,
          y: this._noteData.y,
        });
      }
    });

    // Content editing
    titleInput?.addEventListener("input", () => {
      this.emit("note-title-changed", {
        id: this._noteData.id,
        title: titleInput.value,
      });
    });

    contentArea?.addEventListener("input", () => {
      this.emit("note-content-changed", {
        id: this._noteData.id,
        text: contentArea.value,
      });
    });

    // Actions
    deleteBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit("note-delete-requested", { id: this._noteData.id });
    });

    addChildBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit("note-add-child-requested", { id: this._noteData.id });
    });

    deepDiveBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit("note-deep-dive-requested", { id: this._noteData.id });
    });

    expandBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.emit("note-toggle-collapse", { id: this._noteData.id });
    });
  }

  setNoteData(data) {
    console.log('📌 setNoteData called for:', data.id, data.title);
    this._noteData = { ...this._noteData, ...data };
    this.render();
    this.attachEventListeners();
    console.log('  → Shadow DOM has content:', this.shadowRoot.innerHTML.length > 0);
    console.log('  → Shadow DOM children:', this.shadowRoot.children.length);
  }
}

customElements.define('neuro-note-card', NeuroNoteCard);
