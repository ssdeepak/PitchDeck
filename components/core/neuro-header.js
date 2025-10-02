import { BaseComponent } from '../utils/base-component.js';

/**
 * NeuroHeader Component
 * Top navigation bar with logo and canvas title
 */
export class NeuroHeader extends BaseComponent {
  constructor() {
    super();
    this._canvasName = 'Untitled Canvas';
    this._isDirty = false;
  }

  static get observedAttributes() {
    return ['canvas-name', 'is-dirty'];
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'canvas-name') {
      this._canvasName = newValue || 'Untitled Canvas';
      this.updateTitle();
    } else if (name === 'is-dirty') {
      this._isDirty = newValue === 'true';
      this.updateTitle();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo span {
          font-weight: 400;
          opacity: 0.9;
        }

        .canvas-title {
          font-size: 0.9rem;
          font-weight: normal;
          opacity: 0.85;
          margin-left: 16px;
        }

        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .btn .material-icons {
          font-size: 18px;
        }
      </style>

      <header class="header">
        <div class="logo">
          <span class="material-icons">psychology</span>
          Neuro<span>Notes</span>
          <span class="canvas-title" id="canvasTitle">— ${this._canvasName}${this._isDirty ? ' *' : ''}</span>
        </div>
        <div class="actions">
          <button class="btn" id="newNoteBtn">
            <span class="material-icons">add</span>
            New Note
          </button>
          <button class="btn" id="analyzeBtn">
            <span class="material-icons">auto_awesome</span>
            Analyze
          </button>
          <button class="btn" id="beautifyBtn">
            <span class="material-icons">auto_fix_high</span>
            Beautify
          </button>
          <button class="btn" id="exportBtn">
            <span class="material-icons">download</span>
            Export
          </button>
          <button class="btn" id="templateBtn">
            <span class="material-icons">description</span>
            Templates
          </button>
        </div>
      </header>
    `;
  }

  attachEventListeners() {
    this.$('#newNoteBtn')?.addEventListener('click', () => {
      this.emit('new-note-clicked');
    });

    this.$('#analyzeBtn')?.addEventListener('click', () => {
      this.emit('analyze-clicked');
    });

    this.$('#beautifyBtn')?.addEventListener('click', () => {
      this.emit('beautify-clicked');
    });

    this.$('#exportBtn')?.addEventListener('click', () => {
      this.emit('export-clicked');
    });

    this.$('#templateBtn')?.addEventListener('click', () => {
      this.emit('template-clicked');
    });
  }

  updateTitle() {
    const titleEl = this.$('#canvasTitle');
    if (titleEl) {
      titleEl.textContent = `— ${this._canvasName}${this._isDirty ? ' *' : ''}`;
    }
  }

  setCanvasName(name) {
    this._canvasName = name;
    this.updateTitle();
  }

  setDirty(isDirty) {
    this._isDirty = isDirty;
    this.updateTitle();
  }
}

customElements.define('neuro-header', NeuroHeader);
