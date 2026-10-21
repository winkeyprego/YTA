// Style packs. An episode picks one with "style": "war" | "finance" in shots.json (default "war").
// Same engine, sets, cast and timing; the pack decides look, dialogue, captions, cards and pacing rules.
//   war:     Two Sides of War / War Unspun (docs/REFERENCE-ANALYSIS.md)
//   finance: informed by Crayon Capital (docs/CRAYON-ANALYSIS.md)

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
