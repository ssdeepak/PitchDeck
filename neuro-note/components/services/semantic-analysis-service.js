import { llmService } from './llm-service.js';
import { stateManager } from './state-manager.js';

/**
 * Semantic Analysis Service
 * Handles semantic graph building and relationship detection
 */
class SemanticAnalysisService {
  constructor() {
    this.analysisCache = new Map();
  }

  /**
   * Analyze notes and build semantic graph
   */
  async analyzeNotes(notes) {
    if (notes.length < 2) {
      throw new Error('Need at least 2 notes to establish relationships');
    }

    const notesPayload = notes.map(n => ({
      id: n.id,
      title: n.title || '',
      text: n.text || '',
      x: n.x,
      y: n.y,
      color: n.color
    }));

    const systemPrompt = "You are a rigorous graph-building assistant. Return strict JSON only.";
    const userPrompt = `
You are given user notes. Build a semantic graph that captures clusters and multiple relationships between the notes.

Requirements:
- Return STRICT JSON (no markdown, no preface).
- Schema:
{
  "clusters": [
    { "theme": "string", "notes": ["note_id", ...], "summary": "string optional" }
  ],
  "connections": [
    {
      "sourceId": "note_id",
      "targetId": "note_id", 
      "type": "similarity|causal|contradiction|supports|refines|temporal|related",
      "reason": "short explanation",
      "weight": 0.0-1.0,
      "confidence": 0.0-1.0,
      "directed": true|false
    }
  ]
}
- Allow MULTIPLE connections between the same pair (e.g., similarity + causal).
- "weight": strength of relation; "confidence": confidence in reasoning.
- Prefer short, precise "reason".

Notes:
${JSON.stringify(notesPayload, null, 2)}
    `.trim();

    try {
      // Combine system and user prompts for the LLM service
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const response = await llmService.generate(fullPrompt, {
        temperature: 0.2,
        maxTokens: 2048, // Increase token limit to prevent truncation
      });

      const result = this.safeParseJSON(response);

      if (!result) {
        console.warn('JSON parsing failed, falling back to heuristic analysis');
        throw new Error("Could not parse LLM response as JSON");
      }

      // Ensure we have the required structure
      if (!result.connections) {
        result.connections = [];
      }
      if (!result.clusters) {
        result.clusters = [];
      }

      // Validate connections format
      result.connections = result.connections.filter(conn => 
        conn.sourceId && conn.targetId && conn.type
      );

      console.log(`✅ Parsed semantic analysis: ${result.connections.length} connections, ${result.clusters.length} clusters`);
      return result;
    } catch (error) {
      console.error('LLM semantic analysis failed:', error);
      // Fall back to heuristic analysis
      return this.performHeuristicAnalysis(notesPayload);
    }
  }

  /**
   * Fallback heuristic analysis based on proximity and content similarity
   */
  performHeuristicAnalysis(notes) {
    const connections = [];
    const clusters = [];

    // Generate proximity-based connections
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i], b = notes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 340) {
          const weight = Math.max(0.3, 1 - dist/340);
          
          connections.push({
            sourceId: a.id,
            targetId: b.id,
            type: 'similarity',
            reason: 'Proximity-based heuristic', 
            weight: weight,
            confidence: 0.5,
            directed: false
          });
          
          // Add temporal connection for horizontally aligned notes
          if (Math.abs(dy) < 40 && dx > 0) {
            connections.push({
              sourceId: a.id,
              targetId: b.id,
              type: 'temporal',
              reason: 'Horizontal alignment suggests sequence',
              weight: 0.4,
              confidence: 0.4,
              directed: true
            });
          }
        }
      }
    }

    // Create basic clusters by color
    const colorGroups = {};
    notes.forEach(note => {
      if (!colorGroups[note.color]) colorGroups[note.color] = [];
      colorGroups[note.color].push(note.id);
    });

    Object.entries(colorGroups).forEach(([color, noteIds]) => {
      if (noteIds.length > 1) {
        clusters.push({
          theme: `${color.charAt(0).toUpperCase() + color.slice(1)} themed notes`,
          notes: noteIds,
          summary: `Notes grouped by ${color} color`
        });
      }
    });

    return {
      clusters,
      connections,
      meta: {
        method: 'heuristic',
        totalNotes: notes.length,
        totalConnections: connections.length
      }
    };
  }

  /**
   * Update state with analysis results
   */
  async updateStateWithResults(result) {
    if (!result.connections) return;

    const connections = result.connections.map(conn => ({
      from: conn.sourceId,
      to: conn.targetId,
      type: conn.type,
      reason: conn.reason,
      weight: conn.weight,
      confidence: conn.confidence,
      directed: conn.directed
    }));

    stateManager.setState({ connections });
    
    // Cache results
    const cacheKey = this.generateCacheKey(stateManager.getState().notes);
    this.analysisCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Get connection color by type
   */
  getConnectionColor(type) {
    const colors = {
      'similarity': '#5C6BC0',
      'causal': '#EF6C00', 
      'contradiction': '#E53935',
      'supports': '#2E7D32',
      'refines': '#00897B',
      'temporal': '#8E24AA',
      'related': '#666666'
    };
    return colors[type] || colors.related;
  }

  /**
   * Format analysis results for display
   */
  formatResults(result) {
    let output = '\n🧠 **Semantic Analysis Results**\n\n';
    
    // Show clusters
    if (result.clusters && result.clusters.length > 0) {
      output += '**🏷️ Thematic Clusters:**\n';
      result.clusters.forEach((cluster, i) => {
        output += `${i + 1}. **${cluster.theme}** (${cluster.notes.length} notes)\n`;
        if (cluster.summary) {
          output += `   *${cluster.summary}*\n`;
        }
        output += '\n';
      });
    }
    
    // Show connections by type
    if (result.connections && result.connections.length > 0) {
      const connectionsByType = {};
      result.connections.forEach(conn => {
        if (!connectionsByType[conn.type]) connectionsByType[conn.type] = [];
        connectionsByType[conn.type].push(conn);
      });
      
      output += '**🔗 Relationships Found:**\n';
      Object.entries(connectionsByType).forEach(([type, connections]) => {
        const typeIcons = {
          similarity: '🔄',
          causal: '➡️',
          contradiction: '⚡',
          supports: '✅',
          refines: '🔧',
          temporal: '⏰',
          related: '🔗'
        };
        
        output += `\n${typeIcons[type] || '🔗'} **${type.toUpperCase()}** (${connections.length})\n`;
        connections.forEach(conn => {
          const confidence = Math.round(conn.confidence * 100);
          output += `  • ${conn.reason} (${confidence}% confidence)\n`;
        });
      });
    }

    if (result.meta) {
      output += `\n📊 **Analysis Method**: ${result.meta.method}\n`;
      output += `📈 **Total Connections**: ${result.meta.totalConnections}\n`;
    }
    
    return output;
  }

  /**
   * Safe JSON parsing with truncation handling
   */
  safeParseJSON(text) {
    try {
      // First try direct parsing
      return JSON.parse(text);
    } catch (e) {
      // Try extracting JSON from text
      try {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          return JSON.parse(text.slice(start, end + 1));
        }
      } catch (e2) {
        // Try to repair incomplete JSON
        try {
          const start = text.indexOf("{");
          if (start !== -1) {
            let jsonText = text.slice(start);
            
            // Count braces to find where JSON might be incomplete
            let braceCount = 0;
            let lastValidPos = -1;
            
            for (let i = 0; i < jsonText.length; i++) {
              if (jsonText[i] === '{') braceCount++;
              else if (jsonText[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  lastValidPos = i;
                  break;
                }
              }
            }
            
            if (lastValidPos > 0) {
              return JSON.parse(jsonText.slice(0, lastValidPos + 1));
            }
            
            // If JSON is incomplete, try to close it
            if (braceCount > 0) {
              // Remove incomplete strings and add closing braces
              let repairedJson = jsonText.replace(/"[^"]*$/, '""'); // Close incomplete strings
              repairedJson = repairedJson.replace(/,\s*$/, ''); // Remove trailing commas
              
              // Add missing closing braces
              for (let i = 0; i < braceCount; i++) {
                repairedJson += '}';
              }
              
              return JSON.parse(repairedJson);
            }
          }
        } catch (e3) {
          console.warn('JSON repair failed, raw:', text.substring(0, 500) + '...');
        }
      }
      
      console.warn('All JSON parsing attempts failed');
      return null;
    }
  }

  /**
   * Generate cache key for analysis results
   */
  generateCacheKey(notes) {
    const simplified = notes.map(n => ({
      id: n.id,
      title: n.title?.substring(0, 50) || '',
      text: n.text?.substring(0, 100) || '',
      x: Math.round(n.x / 50) * 50, // Round to nearest 50px for stability
      y: Math.round(n.y / 50) * 50
    }));
    return JSON.stringify(simplified);
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

// Export singleton instance
export const semanticAnalysisService = new SemanticAnalysisService();