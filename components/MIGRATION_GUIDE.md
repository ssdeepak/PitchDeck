# NeuroNotes Web Components Migration

## 🎯 Overview

This is the modular web components version of NeuroNotes, breaking down the monolithic `note.html` (2700+ lines) into small, reusable, maintainable components.

## 📁 Directory Structure

```
components/
├── README.md                          # This file
├── core/                              # Core UI components
│   ├── neuro-app.js                  # Main app shell
│   ├── neuro-header.js               # Top navigation
│   ├── neuro-hamburger.js            # Hamburger menu button
│   ├── neuro-note-card.js            # Sticky note component
│   ├── neuro-canvas.js               # Pan/zoom canvas (TODO)
│   ├── neuro-sidebar.js              # Left drawer (TODO)
│   ├── neuro-settings-drawer.js      # Right drawer (TODO)
│   └── neuro-connection-renderer.js  # SVG connections (TODO)
├── features/                          # Feature components
│   ├── neuro-template-wizard.js      # Template selection (TODO)
│   ├── neuro-document-generator.js   # Doc generation (TODO)
│   ├── neuro-force-layout.js         # Auto-layout algorithm (TODO)
│   └── neuro-deep-dive.js            # Deep dive feature (TODO)
├── services/                          # Business logic services
│   ├── state-manager.js              # ✅ Centralized state
│   ├── storage-service.js            # IndexedDB (TODO)
│   ├── llm-service.js                # LLM integration (TODO)
│   └── canvas-service.js             # Canvas operations (TODO)
└── utils/                             # Utilities
    ├── base-component.js              # ✅ Base class
    ├── event-bus.js                   # ✅ Pub/sub system
    └── helpers.js                     # Helper functions (TODO)
```

## ✅ Completed Components

### Core Components
- **neuro-app** - Main application shell, orchestrates all components
- **neuro-header** - Top navigation with logo, title, and action buttons
- **neuro-hamburger** - Reusable hamburger menu button
- **neuro-note-card** - Individual sticky note with drag, edit, and actions

### Services
- **state-manager** - Centralized reactive state management
- **event-bus** - Pub/sub event system for component communication

### Utilities
- **base-component** - Base class with lifecycle methods, event handling
- Includes Shadow DOM, CSS encapsulation, state management

## 🚧 TODO Components

### Core UI (Priority 1)
- [ ] **neuro-canvas** - Canvas container with pan/zoom/transform logic
- [ ] **neuro-connection-renderer** - SVG bezier curves between notes
- [ ] **neuro-sidebar** - Left drawer with canvas list
- [ ] **neuro-settings-drawer** - Right drawer with LLM settings

### Features (Priority 2)
- [ ] **neuro-template-wizard** - Template selection modal
- [ ] **neuro-document-generator** - Document generation with streaming
- [ ] **neuro-export-panel** - Export to MD/PDF/clipboard
- [ ] **neuro-deep-dive** - LLM-powered note expansion
- [ ] **neuro-force-layout** - Force-directed layout algorithm

### Services (Priority 3)
- [ ] **storage-service** - IndexedDB CRUD operations
- [ ] **llm-service** - OpenAI/Ollama/Azure integration with streaming
- [ ] **canvas-service** - Canvas management (save/load/list)

### Utilities (Priority 4)
- [ ] **helpers.js** - Coordinate transforms, ID generation, etc.

## 🚀 Quick Start

### 1. Development
```bash
# Serve with a local server (required for ES modules)
python -m http.server 8000
# or
npx serve
```

Open `http://localhost:8000/index-components.html`

### 2. Component Usage

```javascript
// Import and use
import { NeuroNoteCard } from './components/core/neuro-note-card.js';

// In HTML
<neuro-note-card note-id="123"></neuro-note-card>

// Programmatically
const note = document.createElement('neuro-note-card');
note.setNoteData({
  id: 'note_123',
  title: 'My Note',
  text: 'Content here',
  x: 100,
  y: 100,
  color: '#FFE4B5'
});
document.body.appendChild(note);
```

### 3. State Management

```javascript
import { stateManager } from './components/services/state-manager.js';

// Get state
const state = stateManager.getState();

// Update state
stateManager.setState({ 
  zoom: 1.5,
  pan: { x: 100, y: 200 }
});

// Subscribe to changes
const unsubscribe = stateManager.subscribe((oldState, newState) => {
  console.log('State changed:', newState);
});

// Subscribe to specific property
stateManager.subscribeToProperty('zoom', (newZoom, oldZoom) => {
  console.log('Zoom changed:', newZoom);
});
```

### 4. Event Communication

```javascript
import { eventBus } from './components/utils/event-bus.js';

// Emit event
eventBus.emit('note-created', { id: '123', title: 'Test' });

// Listen to event
eventBus.on('note-created', (data) => {
  console.log('Note created:', data);
});

// Listen once
eventBus.once('app-loaded', () => {
  console.log('App loaded');
});
```

## 🏗️ Component Architecture

### Base Component Pattern

All components extend `BaseComponent`:

```javascript
import { BaseComponent } from '../utils/base-component.js';

export class MyComponent extends BaseComponent {
  constructor() {
    super();
    // Initialize state
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <style>
        /* Component-specific styles */
      </style>
      <!-- Component template -->
    `;
  }

  attachEventListeners() {
    this.$('#myButton')?.addEventListener('click', () => {
      this.emit('button-clicked', { data: 'test' });
    });
  }
}

customElements.define('my-component', MyComponent);
```

### Communication Patterns

1. **Parent → Child**: Via attributes and properties
2. **Child → Parent**: Via custom events
3. **Sibling ↔ Sibling**: Via event bus or state manager
4. **Global State**: Via state manager subscriptions

## 📊 Benefits

### Before (Monolithic)
- ❌ 2700+ lines in single file
- ❌ Tight coupling between features
- ❌ Difficult to test individual features
- ❌ Hard to reuse components
- ❌ Full re-render on every change

### After (Modular)
- ✅ ~100-300 lines per component
- ✅ Loose coupling via events
- ✅ Easy to test in isolation
- ✅ Reusable components
- ✅ Granular updates only where needed
- ✅ Better performance with Shadow DOM
- ✅ Easier onboarding for new developers

## 🔄 Migration Strategy

### Phase 1: Core Infrastructure ✅
- [x] Base component class
- [x] Event bus
- [x] State manager
- [x] Main app shell
- [x] Header component
- [x] Note card component

### Phase 2: Canvas & Rendering 🚧
- [ ] Canvas component with pan/zoom
- [ ] Connection renderer with SVG
- [ ] Transform utilities
- [ ] Coordinate helpers

### Phase 3: UI Shell
- [ ] Sidebar (canvas list)
- [ ] Settings drawer
- [ ] Modal components
- [ ] Hamburger menus integration

### Phase 4: Features
- [ ] Template wizard
- [ ] Document generator
- [ ] Deep dive
- [ ] Force layout
- [ ] Export system

### Phase 5: Services
- [ ] Storage service (IndexedDB)
- [ ] LLM service (streaming)
- [ ] Canvas service (CRUD)

### Phase 6: Polish
- [ ] Loading states
- [ ] Error boundaries
- [ ] Animations
- [ ] Accessibility
- [ ] Mobile responsiveness

## 🧪 Testing

```javascript
// Unit test example
import { NeuroNoteCard } from './core/neuro-note-card.js';

describe('NeuroNoteCard', () => {
  it('should emit event on title change', () => {
    const note = new NeuroNoteCard();
    let emittedData;
    
    note.addEventListener('note-title-changed', (e) => {
      emittedData = e.detail;
    });
    
    note.setNoteData({ id: '123', title: 'Test' });
    const input = note.shadowRoot.querySelector('.note-title');
    input.value = 'New Title';
    input.dispatchEvent(new Event('input'));
    
    expect(emittedData).toEqual({ id: '123', title: 'New Title' });
  });
});
```

## 📝 Next Steps

1. **Implement remaining core components** (canvas, connections, drawers)
2. **Add storage service** with IndexedDB
3. **Port LLM integration** with streaming
4. **Add feature components** (template wizard, doc gen)
5. **Implement force layout algorithm**
6. **Add comprehensive tests**
7. **Optimize performance** (lazy loading, virtualization)
8. **Add documentation** for each component

## 🤝 Contributing

When adding new components:
1. Extend `BaseComponent`
2. Use Shadow DOM for style encapsulation
3. Emit custom events for parent communication
4. Subscribe to state changes via `stateManager`
5. Use event bus for sibling communication
6. Add JSDoc comments
7. Keep components under 300 lines

## 📖 Resources

- [Web Components Docs](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [Template Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
