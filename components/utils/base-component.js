import { themeService } from "../../services/theme-service.js";

/**
 * Base Component Class
 * All web components extend this class for shared functionality
 */
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._state = {};
    this._subscriptions = [];
    this._themeUnsubscribe = null;
  }

  /**
   * Lifecycle: called when element is added to DOM
   */
  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.setupThemeSubscription();
  }

  /**
   * Lifecycle: called when element is removed from DOM
   */
  disconnectedCallback() {
    this.cleanup();
    if (this._themeUnsubscribe) {
      this._themeUnsubscribe();
    }
  }

  /**
   * Setup theme change subscription
   */
  setupThemeSubscription() {
    this._themeUnsubscribe = themeService.subscribe((theme) => {
      this.onThemeChange(theme);
    });
  }

  /**
   * Handle theme changes - can be overridden by components
   */
  onThemeChange(theme) {
    // Theme is handled at document level via CSS custom properties
    // Components automatically inherit the variables
    console.log(
      `🎨 Component ${this.constructor.name} received theme change:`,
      theme
    );
  }

  /**
   * Lifecycle: called when element is removed from DOM
   */
  disconnectedCallback() {
    this.cleanup();
    // Unsubscribe from all events
    this._subscriptions.forEach((unsubscribe) => unsubscribe());
    this._subscriptions = [];
  }

  /**
   * Lifecycle: called when attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChange(name, oldValue, newValue);
    }
  }

  /**
   * Override in child classes to define observed attributes
   */
  static get observedAttributes() {
    return [];
  }

  /**
   * Render the component (override in child classes)
   */
  render() {
    throw new Error("render() must be implemented by child class");
  }

  /**
   * Attach event listeners (override in child classes)
   */
  attachEventListeners() {
    // Override in child classes
  }

  /**
   * Cleanup (override in child classes)
   */
  cleanup() {
    // Override in child classes
  }

  /**
   * Handle attribute changes (override in child classes)
   */
  onAttributeChange(name, oldValue, newValue) {
    // Override in child classes
  }

  /**
   * Set component state and re-render
   */
  setState(newState) {
    this._state = { ...this._state, ...newState };
    this.render();
  }

  /**
   * Get component state
   */
  getState() {
    return this._state;
  }

  /**
   * Create element from HTML string
   */
  createElementFromHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  /**
   * Query selector in shadow DOM
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Query selector all in shadow DOM
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Emit custom event
   */
  emit(eventName, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Subscribe to event bus (auto-cleanup on disconnect)
   */
  subscribe(event, callback) {
    const unsubscribe = window.eventBus?.on(event, callback);
    if (unsubscribe) {
      this._subscriptions.push(unsubscribe);
    }
    return unsubscribe;
  }

  /**
   * Publish to event bus
   */
  publish(event, data) {
    window.eventBus?.emit(event, data);
  }

  /**
   * Common styles for all components
   */
  getCommonStyles() {
    return `
      <style>
        * {
          box-sizing: border-box;
        }
        
        :host {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .material-icons {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga';
        }

        ${themeService.getComponentStyles()}
        
        /* Theme transition for smooth changes */
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
      </style>
    `;
  }
}
