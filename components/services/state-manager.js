/**
 * State Manager - Centralized application state
 * Simple reactive state management with pub/sub
 */
class StateManager {
  constructor() {
    this.state = {
      // Canvas state
      notes: [],
      connections: [],
      noteHierarchy: {},
      collapsedNotes: new Set(),
      pan: { x: 0, y: 0 },
      zoom: 1,
      
      // Canvas management
      currentCanvasId: null,
      currentCanvasName: 'Untitled Canvas',
      canvases: [],
      isDirty: false,
      
      // UI state
      leftDrawerOpen: false,
      rightDrawerOpen: false,
      templateWizardOpen: false,
      documentGeneratorOpen: false,
      
      // LLM config
      llmConfig: {
        provider: 'ollama',
        model: 'llama3.2',
        apiKey: '',
        endpoint: 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 2048
      },
      
      // Selected items
      selectedTemplate: null,
      selectedNotes: new Set()
    };
    
    this.subscribers = {};
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Update state and notify subscribers
   */
  setState(updates) {
    const oldState = { ...this.state };
    
    // Deep merge for nested objects
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
        this.state[key] = { ...this.state[key], ...updates[key] };
      } else {
        this.state[key] = updates[key];
      }
    });
    
    // Notify subscribers
    this.notifySubscribers(oldState, this.state);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    const id = Math.random().toString(36).slice(2);
    this.subscribers[id] = callback;
    
    // Return unsubscribe function
    return () => {
      delete this.subscribers[id];
    };
  }

  /**
   * Subscribe to specific state property
   */
  subscribeToProperty(property, callback) {
    return this.subscribe((oldState, newState) => {
      if (oldState[property] !== newState[property]) {
        callback(newState[property], oldState[property]);
      }
    });
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(oldState, newState) {
    Object.values(this.subscribers).forEach(callback => {
      try {
        callback(oldState, newState);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Get a specific note by ID
   */
  getNote(id) {
    return this.state.notes.find(n => n.id === id);
  }

  /**
   * Add a note
   */
  addNote(note) {
    this.setState({
      notes: [...this.state.notes, note],
      isDirty: true
    });
  }

  /**
   * Update a note
   */
  updateNote(id, updates) {
    const notes = this.state.notes.map(n =>
      n.id === id ? { ...n, ...updates } : n
    );
    this.setState({ notes, isDirty: true });
  }

  /**
   * Delete a note
   */
  deleteNote(id) {
    const notes = this.state.notes.filter(n => n.id !== id);
    const connections = this.state.connections.filter(
      c => c.from !== id && c.to !== id
    );
    this.setState({ notes, connections, isDirty: true });
  }

  /**
   * Add a connection
   */
  addConnection(connection) {
    this.setState({
      connections: [...this.state.connections, connection],
      isDirty: true
    });
  }

  /**
   * Delete connections for a note
   */
  deleteConnectionsForNote(noteId) {
    const connections = this.state.connections.filter(
      c => c.from !== noteId && c.to !== noteId
    );
    this.setState({ connections, isDirty: true });
  }

  /**
   * Mark canvas as dirty (needs save)
   */
  markDirty() {
    this.setState({ isDirty: true });
  }

  /**
   * Mark canvas as clean (saved)
   */
  markClean() {
    this.setState({ isDirty: false });
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.setState({
      notes: [],
      connections: [],
      noteHierarchy: {},
      collapsedNotes: new Set(),
      pan: { x: 0, y: 0 },
      zoom: 1,
      currentCanvasId: null,
      currentCanvasName: 'Untitled Canvas',
      isDirty: false,
      selectedNotes: new Set()
    });
  }
}

// Export singleton instance
export const stateManager = new StateManager();
