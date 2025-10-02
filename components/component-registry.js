/**
 * Component Registry
 * Central registry of all components with metadata
 */

export const componentRegistry = {
  // Core UI Components
  'neuro-app': {
    path: './core/neuro-app.js',
    status: 'complete',
    description: 'Main application shell',
    dependencies: ['neuro-header', 'neuro-hamburger', 'neuro-note-card'],
    events: {
      emits: ['app-loaded', 'app-error'],
      listens: ['state-changed']
    }
  },
  
  'neuro-header': {
    path: './core/neuro-header.js',
    status: 'complete',
    description: 'Top navigation bar with logo and actions',
    events: {
      emits: ['new-note-clicked', 'analyze-clicked', 'template-clicked'],
      listens: []
    }
  },
  
  'neuro-hamburger': {
    path: './core/neuro-hamburger.js',
    status: 'complete',
    description: 'Reusable hamburger menu button',
    attributes: ['position', 'icon'],
    events: {
      emits: ['hamburger-clicked'],
      listens: []
    }
  },
  
  'neuro-note-card': {
    path: './core/neuro-note-card.js',
    status: 'complete',
    description: 'Individual sticky note component',
    attributes: ['note-id', 'note-data'],
    events: {
      emits: [
        'note-title-changed',
        'note-content-changed',
        'note-moved',
        'note-delete-requested',
        'note-add-child-requested',
        'note-deep-dive-requested',
        'note-toggle-collapse'
      ],
      listens: []
    }
  },

  // TODO: Core UI
  'neuro-canvas': {
    path: './core/neuro-canvas.js',
    status: 'todo',
    description: 'Pan/zoom canvas container',
    events: {
      emits: ['canvas-panned', 'canvas-zoomed', 'canvas-clicked'],
      listens: ['update-transform']
    }
  },

  'neuro-connection-renderer': {
    path: './core/neuro-connection-renderer.js',
    status: 'todo',
    description: 'SVG bezier curves for note connections',
    events: {
      emits: ['connection-clicked', 'connection-hover'],
      listens: ['notes-changed', 'connections-changed']
    }
  },

  'neuro-sidebar': {
    path: './core/neuro-sidebar.js',
    status: 'todo',
    description: 'Left drawer with canvas list',
    attributes: ['open'],
    events: {
      emits: ['canvas-selected', 'new-canvas-clicked', 'canvas-deleted'],
      listens: ['canvases-changed']
    }
  },

  'neuro-settings-drawer': {
    path: './core/neuro-settings-drawer.js',
    status: 'todo',
    description: 'Right drawer with LLM settings',
    attributes: ['open'],
    events: {
      emits: ['settings-changed'],
      listens: ['llm-config-changed']
    }
  },

  // Feature Components
  'neuro-template-wizard': {
    path: './features/neuro-template-wizard.js',
    status: 'todo',
    description: 'Template selection modal',
    attributes: ['open'],
    events: {
      emits: ['template-selected', 'wizard-closed'],
      listens: []
    }
  },

  'neuro-document-generator': {
    path: './features/neuro-document-generator.js',
    status: 'todo',
    description: 'Document generation with LLM streaming',
    attributes: ['open', 'template'],
    events: {
      emits: ['generation-started', 'generation-progress', 'generation-complete'],
      listens: ['selected-notes-changed']
    }
  },

  'neuro-deep-dive': {
    path: './features/neuro-deep-dive.js',
    status: 'todo',
    description: 'LLM-powered note expansion',
    events: {
      emits: ['deep-dive-started', 'deep-dive-complete'],
      listens: []
    }
  },

  'neuro-force-layout': {
    path: './features/neuro-force-layout.js',
    status: 'todo',
    description: 'Force-directed layout algorithm',
    events: {
      emits: ['layout-started', 'layout-complete'],
      listens: ['notes-changed']
    }
  },

  'neuro-export-panel': {
    path: './features/neuro-export-panel.js',
    status: 'todo',
    description: 'Export to MD/PDF/clipboard',
    attributes: ['open', 'format'],
    events: {
      emits: ['export-started', 'export-complete'],
      listens: []
    }
  }
};

/**
 * Get component metadata
 */
export function getComponentInfo(tagName) {
  return componentRegistry[tagName];
}

/**
 * Get all components by status
 */
export function getComponentsByStatus(status) {
  return Object.entries(componentRegistry)
    .filter(([, meta]) => meta.status === status)
    .map(([name, meta]) => ({ name, ...meta }));
}

/**
 * Get component dependency tree
 */
export function getComponentDependencies(tagName) {
  const component = componentRegistry[tagName];
  if (!component || !component.dependencies) return [];
  
  const deps = [...component.dependencies];
  component.dependencies.forEach(dep => {
    deps.push(...getComponentDependencies(dep));
  });
  
  return [...new Set(deps)];
}

/**
 * Validate component is ready to use
 */
export function isComponentReady(tagName) {
  const component = componentRegistry[tagName];
  if (!component) return false;
  if (component.status !== 'complete') return false;
  
  // Check dependencies
  if (component.dependencies) {
    return component.dependencies.every(dep => isComponentReady(dep));
  }
  
  return true;
}

// Export registry statistics
export const stats = {
  total: Object.keys(componentRegistry).length,
  complete: getComponentsByStatus('complete').length,
  todo: getComponentsByStatus('todo').length,
  get progress() {
    return Math.round((this.complete / this.total) * 100);
  }
};

console.log('📊 Component Registry Stats:', stats);
