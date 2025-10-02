#!/usr/bin/env node

/**
 * Component Generator
 * Quick scaffolding for new components
 * 
 * Usage: node create-component.js <component-name> <category>
 * Example: node create-component.js neuro-sidebar core
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const componentName = args[0];
const category = args[1] || 'core';

if (!componentName) {
  console.error('❌ Please provide a component name');
  console.log('Usage: node create-component.js <component-name> <category>');
  console.log('Example: node create-component.js neuro-sidebar core');
  process.exit(1);
}

// Convert kebab-case to PascalCase
function toPascalCase(str) {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const className = toPascalCase(componentName);
const fileName = `${componentName}.js`;
const filePath = path.join(__dirname, category, fileName);

// Check if file exists
if (fs.existsSync(filePath)) {
  console.error(`❌ Component ${componentName} already exists at ${filePath}`);
  process.exit(1);
}

// Component template
const template = `import { BaseComponent } from '../utils/base-component.js';

/**
 * ${className} Component
 * TODO: Add component description
 */
export class ${className} extends BaseComponent {
  constructor() {
    super();
    // Initialize component state
  }

  static get observedAttributes() {
    return [];
    // Example: return ['open', 'title'];
  }

  onAttributeChange(name, oldValue, newValue) {
    // Handle attribute changes
    // Example:
    // if (name === 'open') {
    //   this.render();
    // }
  }

  render() {
    this.shadowRoot.innerHTML = \`
      \${this.getCommonStyles()}
      <style>
        :host {
          display: block;
        }

        /* Component-specific styles */
        .container {
          padding: 16px;
        }
      </style>

      <!-- Component template -->
      <div class="container">
        <h2>${className}</h2>
        <p>Component content goes here</p>
      </div>
    \`;
  }

  attachEventListeners() {
    // Attach event listeners to elements
    // Example:
    // this.$('#myButton')?.addEventListener('click', () => {
    //   this.emit('button-clicked', { data: 'value' });
    // });
  }

  cleanup() {
    // Cleanup when component is removed
    // Example: clear intervals, remove event listeners
  }

  // Public methods
  
  /**
   * Example public method
   */
  doSomething() {
    console.log('${className} doing something');
  }

  // Private methods (prefix with _)
  
  /**
   * Example private method
   */
  _helperMethod() {
    // Internal logic
  }
}

// Register the custom element
customElements.define('${componentName}', ${className});
`;

// Ensure directory exists
const dir = path.join(__dirname, category);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write file
fs.writeFileSync(filePath, template, 'utf8');
 