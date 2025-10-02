# NeuroNotes Web Components Architecture

## Component Structure

This directory contains modular web components that replace the monolithic note.html.

### Core Components

1. **neuro-app** - Main application shell
2. **neuro-header** - Top navigation bar with logo and title
3. **neuro-canvas** - Main canvas with pan/zoom functionality
4. **neuro-note-card** - Individual sticky note
5. **neuro-connection-renderer** - SVG overlay for connections
6. **neuro-sidebar** - Left drawer for canvas list
7. **neuro-settings-drawer** - Right drawer for LLM settings
8. **neuro-template-wizard** - Template selection modal
9. **neuro-document-generator** - Document generation modal
10. **neuro-hamburger-menu** - Reusable hamburger button

### Services

1. **state-manager.js** - Centralized state management
2. **storage-service.js** - IndexedDB operations
3. **llm-service.js** - LLM API integration
4. **canvas-service.js** - Canvas operations

### Utilities

1. **base-component.js** - Base class for all components
2. **event-bus.js** - Component communication
3. **helpers.js** - Shared utility functions

## Usage

```html
<neuro-app></neuro-app>
```

## Benefits

- **Modularity**: Each component is self-contained
- **Reusability**: Components can be used independently
- **Maintainability**: Easier to debug and update
- **Performance**: Lazy loading and better encapsulation
- **Testability**: Components can be tested in isolation
