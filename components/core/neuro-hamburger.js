import { BaseComponent } from '../utils/base-component.js';

/**
 * NeuroHamburger Component
 * Reusable hamburger menu button
 */
export class NeuroHamburger extends BaseComponent {
  static get observedAttributes() {
    return ['position', 'icon'];
  }

  get position() {
    return this.getAttribute('position') || 'left';
  }

  get icon() {
    return this.getAttribute('icon') || 'menu';
  }

  render() {
    const isLeft = this.position === 'left';
    
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        :host {
          display: block;
          position: fixed;
          top: 80px;
          ${isLeft ? 'left: 16px;' : 'right: 16px;'}
          z-index: 30;
        }

        .hamburger-btn {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hamburger-btn:hover {
          background: #f5f5f5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .hamburger-btn .material-icons {
          font-size: 24px;
          color: #333;
        }
      </style>

      <button class="hamburger-btn">
        <span class="material-icons">${this.icon}</span>
      </button>
    `;
  }

  attachEventListeners() {
    this.$('.hamburger-btn')?.addEventListener('click', () => {
      this.emit('hamburger-clicked', { position: this.position });
    });
  }
}

customElements.define('neuro-hamburger', NeuroHamburger);
