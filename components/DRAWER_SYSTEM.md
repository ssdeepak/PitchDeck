# Drawer System

## Overview
The application now has functional left and right drawers that slide in from the sides of the screen.

## Features

### Left Drawer - Canvas List
- **Purpose**: Manage multiple canvases
- **Features**:
  - Shows current active canvas
  - "New Canvas" button to create additional canvases
  - (Future) Switch between canvases
  - (Future) Rename/delete canvases

### Right Drawer - LLM Settings
- **Purpose**: Configure LLM integration
- **Features**:
  - Provider selection (OpenAI, Anthropic, Local)
  - Model name input
  - API endpoint URL
  - Temperature slider (0.0 - 2.0)
  - Save button persists to localStorage

## Usage

### Opening/Closing
- Click hamburger buttons in top-left and top-right corners
- Click the dark overlay to close any open drawer
- Click the ✕ close button in drawer header
- Opening one drawer automatically closes the other

### State Management
- Drawer state tracked in StateManager (`leftDrawerOpen`, `rightDrawerOpen`)
- Settings persisted to `localStorage` key: `neuroNote_llmSettings`

## Implementation Details

### CSS Classes
- `.drawer` - Base drawer styles
- `.left-drawer` - Left positioning, slides from left
- `.right-drawer` - Right positioning, slides from right
- `.open` - Applied when drawer is visible
- `.drawer-overlay` - Dark background overlay
- `.show` - Applied to overlay when any drawer is open

### Animation
- 0.3s ease transition on transform
- Drawers slide in/out using `translateX()`
- Overlay fades in/out with display toggling

### Event Listeners
All drawer interactions are handled in `attachDrawerListeners()`:
- Close button clicks
- Overlay clicks
- Action button clicks (New Canvas, Save Settings)
- Live temperature slider updates

## Code Location
- **Component**: `components/core/neuro-app.js`
- **Methods**:
  - `toggleLeftDrawer()` - Toggle left drawer visibility
  - `toggleRightDrawer()` - Toggle right drawer visibility
  - `attachDrawerListeners()` - Wire up all drawer events
- **HTML**: Generated in `render()` method
- **CSS**: Embedded in `<style>` tag within render()

## Future Enhancements
1. **Canvas Management**:
   - Load canvas list from IndexedDB
   - Display all saved canvases with thumbnails
   - Rename/delete existing canvases
   - Export/import canvases

2. **LLM Settings**:
   - API key management (encrypted storage)
   - Test connection button
   - Provider-specific options
   - Streaming preferences
   - Max tokens configuration

3. **Additional Drawers**:
   - Bottom drawer for templates library
   - Top drawer for search/filter
   - Modal drawer for deep dive analysis

## Testing
To test the drawer system:
1. Open `index-components.html` in browser
2. Click left hamburger button → should see canvas list
3. Click right hamburger button → should see LLM settings
4. Click overlay or close button → drawer should close
5. Fill out LLM settings and save → check localStorage for `neuroNote_llmSettings`
