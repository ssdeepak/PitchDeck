import { stateManager } from './state-manager.js';

/**
 * Sample Canvas Generator
 * Creates example canvases for new users
 */
class SampleCanvasService {
  constructor() {
    this.sampleCanvases = [
      {
        id: 'sample-saas-planning',
        name: '🚀 SaaS Product Planning',
        notes: [
          { 
            id: 'note_1001', 
            x: 100, y: 100, 
            title: 'Product Vision', 
            text: 'Build a productivity app for remote teams with AI assistance', 
            color: 'yellow' 
          },
          { 
            id: 'note_1002', 
            x: 100, y: 280, 
            title: 'Core Features', 
            text: 'Task management, real-time collaboration, AI summaries', 
            color: 'pink' 
          },
          { 
            id: 'note_1003', 
            x: 340, y: 280, 
            title: 'Target Users', 
            text: 'Remote teams (5-50 people), project managers, developers', 
            color: 'pink' 
          },
          { 
            id: 'note_1004', 
            x: 580, y: 280, 
            title: 'Revenue Model', 
            text: 'Freemium with pro features, $10/user/month', 
            color: 'pink' 
          },
          { 
            id: 'note_1005', 
            x: 100, y: 460, 
            title: 'Task Board', 
            text: 'Kanban view with drag-drop, priority labels', 
            color: 'teal' 
          },
          { 
            id: 'note_1006', 
            x: 340, y: 460, 
            title: 'Real-time Sync', 
            text: 'WebSocket updates, collaborative editing like Figma', 
            color: 'teal' 
          },
          { 
            id: 'note_1007', 
            x: 580, y: 460, 
            title: 'AI Assistant', 
            text: 'Summarize meetings, suggest tasks, auto-categorize', 
            color: 'teal' 
          },
          { 
            id: 'note_1008', 
            x: 820, y: 100, 
            title: 'Technical Stack', 
            text: 'React + Node.js + PostgreSQL + Redis', 
            color: 'purple' 
          },
          { 
            id: 'note_1009', 
            x: 820, y: 280, 
            title: 'Go-to-Market', 
            text: 'Product Hunt launch, Reddit communities, content marketing', 
            color: 'yellow' 
          }
        ],
        connections: [
          { from: 'note_1001', to: 'note_1002', type: 'supports', reason: 'Vision drives features', weight: 0.9, confidence: 0.8, directed: true },
          { from: 'note_1001', to: 'note_1003', type: 'supports', reason: 'Vision defines users', weight: 0.9, confidence: 0.8, directed: true },
          { from: 'note_1001', to: 'note_1004', type: 'supports', reason: 'Vision enables monetization', weight: 0.8, confidence: 0.7, directed: true },
          { from: 'note_1002', to: 'note_1005', type: 'refines', reason: 'Feature breakdown', weight: 0.8, confidence: 0.9, directed: true },
          { from: 'note_1002', to: 'note_1006', type: 'refines', reason: 'Feature breakdown', weight: 0.8, confidence: 0.9, directed: true },
          { from: 'note_1002', to: 'note_1007', type: 'refines', reason: 'Feature breakdown', weight: 0.8, confidence: 0.9, directed: true },
          { from: 'note_1002', to: 'note_1008', type: 'supports', reason: 'Features need tech stack', weight: 0.7, confidence: 0.8, directed: false },
          { from: 'note_1004', to: 'note_1009', type: 'causal', reason: 'Revenue enables marketing', weight: 0.6, confidence: 0.7, directed: true }
        ]
      },
      {
        id: 'sample-research-project',
        name: '🔬 Research Project',
        notes: [
          { 
            id: 'note_2001', 
            x: 200, y: 100, 
            title: 'Research Question', 
            text: 'How does remote work affect team collaboration patterns?', 
            color: 'yellow' 
          },
          { 
            id: 'note_2002', 
            x: 100, y: 300, 
            title: 'Literature Review', 
            text: 'Studies on remote work effectiveness, communication tools, team dynamics', 
            color: 'pink' 
          },
          { 
            id: 'note_2003', 
            x: 400, y: 300, 
            title: 'Methodology', 
            text: 'Mixed methods: surveys (n=200), interviews (n=20), behavioral analytics', 
            color: 'pink' 
          },
          { 
            id: 'note_2004', 
            x: 700, y: 300, 
            title: 'Data Collection', 
            text: 'Slack analytics, meeting patterns, productivity metrics, satisfaction scores', 
            color: 'teal' 
          },
          { 
            id: 'note_2005', 
            x: 250, y: 500, 
            title: 'Key Findings', 
            text: 'Async communication increased by 40%, meeting fatigue in 65% of participants', 
            color: 'purple' 
          },
          { 
            id: 'note_2006', 
            x: 550, y: 500, 
            title: 'Implications', 
            text: 'Need for better async tools, structured meeting protocols, social connection time', 
            color: 'purple' 
          }
        ],
        connections: [
          { from: 'note_2001', to: 'note_2002', type: 'causal', reason: 'Question drives literature search', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_2001', to: 'note_2003', type: 'causal', reason: 'Question defines methodology', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_2003', to: 'note_2004', type: 'causal', reason: 'Method determines data', weight: 0.8, confidence: 0.8, directed: true },
          { from: 'note_2004', to: 'note_2005', type: 'causal', reason: 'Data yields findings', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_2005', to: 'note_2006', type: 'causal', reason: 'Findings have implications', weight: 0.8, confidence: 0.8, directed: true },
          { from: 'note_2002', to: 'note_2003', type: 'supports', reason: 'Literature informs method', weight: 0.7, confidence: 0.7, directed: true }
        ]
      },
      {
        id: 'sample-mobile-app',
        name: '📱 Mobile App Architecture',
        notes: [
          { 
            id: 'note_3001', 
            x: 300, y: 100, 
            title: 'Fitness Tracking App', 
            text: 'Cross-platform fitness app with social features and AI coaching', 
            color: 'yellow' 
          },
          { 
            id: 'note_3002', 
            x: 100, y: 280, 
            title: 'Frontend', 
            text: 'React Native for iOS and Android, offline-first architecture', 
            color: 'pink' 
          },
          { 
            id: 'note_3003', 
            x: 400, y: 280, 
            title: 'Backend', 
            text: 'Node.js REST API with GraphQL subscriptions for real-time features', 
            color: 'pink' 
          },
          { 
            id: 'note_3004', 
            x: 700, y: 280, 
            title: 'Database', 
            text: 'MongoDB for user data, Redis for sessions, InfluxDB for time-series metrics', 
            color: 'pink' 
          },
          { 
            id: 'note_3005', 
            x: 100, y: 460, 
            title: 'Authentication', 
            text: 'OAuth 2.0, biometric login, JWT tokens with refresh mechanism', 
            color: 'teal' 
          },
          { 
            id: 'note_3006', 
            x: 400, y: 460, 
            title: 'AI Features', 
            text: 'TensorFlow Lite for local ML, workout recommendations, form analysis', 
            color: 'teal' 
          },
          { 
            id: 'note_3007', 
            x: 700, y: 460, 
            title: 'Deployment', 
            text: 'AWS ECS containers, CloudFront CDN, automated CI/CD pipeline', 
            color: 'purple' 
          }
        ],
        connections: [
          { from: 'note_3001', to: 'note_3002', type: 'supports', reason: 'App needs frontend', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_3001', to: 'note_3003', type: 'supports', reason: 'App needs backend', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_3003', to: 'note_3004', type: 'supports', reason: 'Backend needs database', weight: 0.9, confidence: 0.9, directed: true },
          { from: 'note_3002', to: 'note_3005', type: 'supports', reason: 'Frontend needs auth', weight: 0.8, confidence: 0.8, directed: false },
          { from: 'note_3003', to: 'note_3005', type: 'supports', reason: 'Backend handles auth', weight: 0.8, confidence: 0.8, directed: false },
          { from: 'note_3002', to: 'note_3006', type: 'supports', reason: 'Frontend runs AI models', weight: 0.7, confidence: 0.8, directed: false },
          { from: 'note_3003', to: 'note_3007', type: 'supports', reason: 'Backend needs deployment', weight: 0.8, confidence: 0.8, directed: true }
        ]
      }
    ];
  }

  /**
   * Load a sample canvas
   */
  loadSampleCanvas(canvasId) {
    const canvas = this.sampleCanvases.find(c => c.id === canvasId);
    if (!canvas) {
      console.error('Sample canvas not found:', canvasId);
      return false;
    }

    console.log(`🎯 Loading sample canvas: ${canvas.name}`);

    // Load canvas into state
    stateManager.setState({
      notes: canvas.notes,
      connections: canvas.connections,
      currentCanvasName: canvas.name,
      currentCanvasId: null, // Mark as unsaved
      isDirty: true
    });

    return true;
  }

  /**
   * Get all available sample canvases
   */
  getSampleCanvases() {
    return this.sampleCanvases.map(canvas => ({
      id: canvas.id,
      name: canvas.name,
      noteCount: canvas.notes.length,
      connectionCount: canvas.connections.length
    }));
  }

  /**
   * Check if user should see sample canvases (first time user)
   */
  shouldShowSamples() {
    const state = stateManager.getState();
    const hasNotes = state.notes.length > 0;
    const hasCanvases = state.canvases.length > 0;
    const hasSeenSamples = localStorage.getItem('neuronotes_seen_samples') === 'true';
    
    return !hasNotes && !hasCanvases && !hasSeenSamples;
  }

  /**
   * Mark that user has seen the samples
   */
  markSamplesAsSeen() {
    localStorage.setItem('neuronotes_seen_samples', 'true');
  }

  /**
   * Create first-time user experience with sample selection
   */
  showFirstTimeExperience() {
    if (!this.shouldShowSamples()) {
      return false;
    }

    const modal = document.createElement('div');
    modal.className = 'sample-modal';
    modal.innerHTML = `
      <div class="sample-container">
        <div class="sample-header">
          <h2>🎉 Welcome to NeuroNotes!</h2>
          <p>Get started with a sample canvas or create your own</p>
        </div>
        <div class="sample-grid">
          ${this.sampleCanvases.map(canvas => `
            <div class="sample-card" data-canvas-id="${canvas.id}">
              <h3>${canvas.name}</h3>
              <p>${canvas.notes.length} notes • ${canvas.connections.length} connections</p>
              <div class="sample-preview">
                ${canvas.notes.slice(0, 3).map(note => 
                  `<div class="mini-note color-${note.color}">${note.title || 'Note'}</div>`
                ).join('')}
              </div>
            </div>
          `).join('')}
          <div class="sample-card empty-card">
            <h3>🎨 Start Fresh</h3>
            <p>Create your own canvas from scratch</p>
            <div class="empty-preview">Empty Canvas</div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .sample-modal {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.8);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
      }
      .sample-container {
        background: white; border-radius: 16px;
        max-width: 800px; padding: 32px;
        max-height: 90vh; overflow-y: auto;
      }
      .sample-header { text-align: center; margin-bottom: 24px; }
      .sample-header h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
      .sample-header p { margin: 0; color: #666; }
      .sample-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .sample-card {
        border: 2px solid #e0e0e0; border-radius: 12px;
        padding: 20px; cursor: pointer; transition: all 0.2s;
        text-align: center;
      }
      .sample-card:hover {
        border-color: #667eea; background: #f5f7ff;
        transform: translateY(-2px);
      }
      .sample-card h3 { margin: 0 0 8px 0; font-size: 1.1rem; }
      .sample-card p { margin: 0 0 16px 0; color: #666; font-size: 0.9rem; }
      .sample-preview { display: flex; gap: 4px; justify-content: center; }
      .mini-note {
        width: 40px; height: 30px; border-radius: 4px;
        font-size: 8px; padding: 2px; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap;
      }
      .mini-note.color-yellow { background: #FFF9C4; }
      .mini-note.color-pink { background: #F8BBD0; }
      .mini-note.color-teal { background: #B2DFDB; }
      .mini-note.color-purple { background: #D1C4E9; }
      .empty-preview {
        height: 30px; display: flex; align-items: center;
        justify-content: center; color: #999; font-size: 0.8rem;
      }
      .empty-card { border-style: dashed; }
    `;
    document.head.appendChild(styles);

    document.body.appendChild(modal);

    // Handle clicks
    modal.addEventListener('click', (e) => {
      const card = e.target.closest('.sample-card');
      if (!card) return;

      const canvasId = card.dataset.canvasId;
      if (canvasId) {
        this.loadSampleCanvas(canvasId);
      }
      
      this.markSamplesAsSeen();
      modal.remove();
      styles.remove();

      // Trigger beautify layout after a short delay
      setTimeout(() => {
        const app = document.querySelector('neuro-app');
        if (app && app.beautifyLayout) {
          app.beautifyLayout();
        }
      }, 500);
    });

    return true;
  }
}

// Export singleton instance
export const sampleCanvasService = new SampleCanvasService();