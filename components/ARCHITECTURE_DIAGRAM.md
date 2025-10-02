# Component Architecture Diagram

## Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Window                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              <neuro-header> ✅                            │  │
│  │  Logo | Canvas Title | [New] [Analyze] [Templates]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──┐                                              ┌──┐         │
│  │🍔│ <neuro-hamburger> ✅           ✅ <neuro-hamburger> │⚙️│  │
│  └──┘                                              └──┘         │
│                                                                  │
│  ┌────────────┐  ┌──────────────────────────┐  ┌────────────┐  │
│  │            │  │                          │  │            │  │
│  │  <neuro-   │  │   Canvas Container       │  │  <neuro-   │  │
│  │  sidebar>  │  │                          │  │  settings- │  │
│  │            │  │  ┌─────────┐             │  │  drawer>   │  │
│  │  🚧 TODO   │  │  │ <neuro- │ ✅          │  │            │  │
│  │            │  │  │  note-  │             │  │  🚧 TODO   │  │
│  │  Canvas    │  │  │  card>  │             │  │            │  │
│  │  List:     │  │  └─────────┘             │  │  LLM       │  │
│  │  • Canvas1 │  │                          │  │  Config:   │  │
│  │  • Canvas2 │  │  ┌─────────┐             │  │  • Provider│  │
│  │  [+ New]   │  │  │ <neuro- │ ✅          │  │  • Model   │  │
│  │            │  │  │  note-  │             │  │  • API Key │  │
│  │            │  │  │  card>  │             │  │  • Temp    │  │
│  │            │  │  └─────────┘             │  │            │  │
│  │            │  │         \                │  │            │  │
│  │            │  │          ╲ <neuro-       │  │            │  │
│  │            │  │           connection-    │  │            │  │
│  │            │  │           renderer> 🚧   │  │            │  │
│  └────────────┘  └──────────────────────────┘  └────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Modals (conditional rendering)                    │  │
│  │                                                            │  │
│  │  <neuro-template-wizard> 🚧                               │  │
│  │  <neuro-document-generator> 🚧                            │  │
│  │  <neuro-export-panel> 🚧                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
index-components.html
│
├── Global Scope
│   ├── window.eventBus (Event Bus Singleton)
│   └── window.stateManager (State Manager Singleton)
│
└── <neuro-app> ✅ Main Application Shell
    │
    ├── <neuro-header> ✅
    │   └── Emits: new-note-clicked, analyze-clicked, template-clicked
    │
    ├── <neuro-hamburger position="left"> ✅
    │   └── Emits: hamburger-clicked
    │
    ├── <neuro-hamburger position="right"> ✅
    │   └── Emits: hamburger-clicked
    │
    ├── <neuro-sidebar open={leftDrawerOpen}> 🚧 TODO
    │   ├── Canvas List
    │   └── Emits: canvas-selected, new-canvas-clicked
    │
    ├── <neuro-settings-drawer open={rightDrawerOpen}> 🚧 TODO
    │   ├── LLM Configuration Form
    │   └── Emits: settings-changed
    │
    ├── Canvas Container
    │   ├── #noteCanvas
    │   │   └── <neuro-note-card> (x N) ✅
    │   │       ├── Title Input
    │   │       ├── Content Textarea
    │   │       ├── Action Buttons
    │   │       └── Emits: note-*-changed, note-moved, etc.
    │   │
    │   └── #connectionOverlay (SVG)
    │       └── <neuro-connection-renderer> 🚧 TODO
    │           └── Renders bezier curves
    │
    └── Modals (conditional)
        ├── <neuro-template-wizard> 🚧 TODO
        ├── <neuro-document-generator> 🚧 TODO
        └── <neuro-export-panel> 🚧 TODO
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      State Manager                          │
│  { notes, connections, pan, zoom, currentCanvas, ... }      │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ setState()                 │ subscribe()
             │                            │
       ┌─────▼─────┐                ┌────▼─────┐
       │ Component │                │Component │
       │  Updates  │                │ Listens  │
       │   State   │                │ & Re-    │
       │           │                │ renders  │
       └───────────┘                └──────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Event Bus                            │
│        Global pub/sub for component communication           │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ emit()                     │ on()
             │                            │
       ┌─────▼─────┐                ┌────▼─────┐
       │Component A│                │Component B│
       │  Emits    │───────────────▶│  Listens │
       │  Event    │                │ & Reacts │
       └───────────┘                └──────────┘
```

## Communication Patterns

### 1. Parent → Child (Props/Attributes)
```
<neuro-app>
    │
    ├─ canvas-name="My Canvas" ─┐
    │                           │
    └──▶ <neuro-header>         │
            receives attribute ──┘
```

### 2. Child → Parent (Custom Events)
```
<neuro-header>
    │
    │ User clicks "New Note"
    │
    ├─ emit('new-note-clicked')
    │
    ▼
<neuro-app>
    listens and handles event
```

### 3. Sibling ↔ Sibling (Event Bus)
```
<neuro-template-wizard>
    │
    │ eventBus.emit('template-selected')
    │
    ▼
Event Bus
    │
    ▼
<neuro-document-generator>
    eventBus.on('template-selected')
```

### 4. Any ↔ State (State Manager)
```
<neuro-note-card>
    │
    │ stateManager.updateNote(id, { x, y })
    │
    ▼
State Manager
    │
    │ notifies all subscribers
    │
    ▼
<neuro-connection-renderer>
    stateManager.subscribe(() => render())
```

## File Organization

```
components/
│
├── core/                    # Core UI components
│   ├── neuro-app.js        ✅ Main shell
│   ├── neuro-header.js     ✅ Top bar
│   ├── neuro-hamburger.js  ✅ Menu button
│   ├── neuro-note-card.js  ✅ Sticky note
│   ├── neuro-canvas.js     🚧 Canvas container
│   ├── neuro-connection-renderer.js  🚧 SVG lines
│   ├── neuro-sidebar.js    🚧 Left drawer
│   └── neuro-settings-drawer.js  🚧 Right drawer
│
├── features/               # Feature components
│   ├── neuro-template-wizard.js  🚧 Templates
│   ├── neuro-document-generator.js  🚧 Doc gen
│   ├── neuro-deep-dive.js  🚧 LLM expansion
│   ├── neuro-force-layout.js  🚧 Auto-layout
│   └── neuro-export-panel.js  🚧 Export
│
├── services/               # Business logic
│   ├── state-manager.js    ✅ State management
│   ├── storage-service.js  🚧 IndexedDB
│   ├── llm-service.js      🚧 LLM integration
│   └── canvas-service.js   🚧 Canvas ops
│
├── utils/                  # Utilities
│   ├── base-component.js   ✅ Base class
│   ├── event-bus.js        ✅ Pub/sub
│   └── helpers.js          🚧 Helpers
│
├── component-registry.js   ✅ Metadata
├── create-component.js     ✅ Generator
├── MIGRATION_GUIDE.md      ✅ Architecture docs
└── README.md               ✅ Quick start
```

## Component Status

| Component | Status | Lines | Priority |
|-----------|--------|-------|----------|
| neuro-app | ✅ | 250 | - |
| neuro-header | ✅ | 145 | - |
| neuro-hamburger | ✅ | 65 | - |
| neuro-note-card | ✅ | 290 | - |
| neuro-canvas | 🚧 | 0 | HIGH |
| neuro-connection-renderer | 🚧 | 0 | HIGH |
| neuro-sidebar | 🚧 | 0 | HIGH |
| neuro-settings-drawer | 🚧 | 0 | HIGH |
| neuro-template-wizard | 🚧 | 0 | MEDIUM |
| neuro-document-generator | 🚧 | 0 | MEDIUM |
| state-manager | ✅ | 185 | - |
| event-bus | ✅ | 60 | - |
| base-component | ✅ | 180 | - |
| storage-service | 🚧 | 0 | HIGH |
| llm-service | 🚧 | 0 | MEDIUM |

**Progress: 4/14 components complete (29%)**

## Next Steps Priority

1. **🔥 neuro-canvas** - Extract pan/zoom logic
2. **🔥 neuro-connection-renderer** - SVG bezier curves
3. **🔥 storage-service** - IndexedDB operations
4. **🔥 neuro-sidebar** - Canvas list drawer
5. **⚡ neuro-settings-drawer** - LLM config drawer
6. **⚡ neuro-template-wizard** - Template UI
7. **⚡ neuro-document-generator** - Doc generation
8. **📊 llm-service** - LLM integration
9. **🎨 neuro-force-layout** - Auto-layout
10. **📤 neuro-export-panel** - Export UI

Legend:
- ✅ Complete
- 🚧 TODO
- 🔥 Critical Priority
- ⚡ High Priority
- 📊 Medium Priority
- 🎨 Low Priority
