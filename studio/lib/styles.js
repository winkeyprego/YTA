// Presets. ONE shared style: every template, kit, set, character and graphic works in every video.
// A preset ("style": "war" | "finance" in shots.json, default "war") only sets DEFAULTS for a topic,
// and every shot can override them:
//   dialogue  shot "dialogue": "bubble" | "float"  (or "bubble": true)
//   tag       "tag": { "text": "...", "style": "tape" | "script" }
//   chapter   chapter shot "style": "serif" | "script"
//   vignette  any shot "vignette": 0..1 (or true for the strong look)
//   camera    any shot "camera"
// Measured sources: war = docs/REFERENCE-ANALYSIS.md, finance = docs/CRAYON-ANALYSIS.md.

const STYLES = {
  war: {
    name: 'war',
    vignette: true,          // strong: corners ~0.6 of centre
    dialogue: 'bubble',      // speech bubbles, typed ~18 cps
    tag: 'tape',             // taped paper date tag, top-left
    chapter: 'serif',        // black card, serif small caps, 2.0s
    camera: 'creep',         // default camera for talk shots
    cps: 18,
    pacing: { maxShot: 8, maxBuild: 13, maxGap: 4 },
  },
  finance: {
    name: 'finance',
    vignette: 0.25,          // light: corners ~0.9 of centre
    dialogue: 'float',       // floating handwritten line above the speaker; bubbles only when "bubble": true
    tag: 'script',           // handwritten corner caption ("New York, 2008")
    chapter: 'script',       // black card, handwritten title
    camera: 'locked',        // locked by default; push-ins on emotional/close beats
    cps: 30,
    pacing: { maxShot: 7, maxBuild: 15, maxGap: 3 },
  },
};

const styleOf = (name) => STYLES[name || 'war'] || STYLES.war;

module.exports = { STYLES, styleOf };
