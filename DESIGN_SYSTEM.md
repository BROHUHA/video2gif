# CHAOTIC NEO-BRUTALISM DESIGN SYSTEM

**Version:** 2.0  
**Date:** 2026-02-02  
**Style:** Playful Chaotic Neo-Brutalism  

---

## DESIGN PHILOSOPHY

**Core Principle:** "Organized Chaos"  
Neo-brutalism meets playful maximalism. Every element feels hand-placed, slightly imperfect, but intentionally designed. The goal is to create **joy** and **personality** while maintaining **usability** and **accessibility**.

---

## COLOR PALETTE

### Primary Colors
```css
--lime:    #84cc16  /* Primary CTA, highlights */
--yellow:  #fbbf24  /* Secondary accent, warmth */
--cyan:    #22d3ee  /* Cool accent, tech feel */
--pink:    #f472b6  /* Playful accent */
--purple:  #a78bfa  /* Soft accent */
```

### Backgrounds
```css
--bg-main: linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%)
/* Soft cream-to-yellow gradient for warmth */
```

### Semantic Colors
```css
--black:   #000000  /* Borders, text */
--white:   #ffffff  /* Cards, surfaces */
--red:     #dc2626  /* Errors */
```

---

## TYPOGRAPHY

### Font Family
```css
font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif;
```

**Rationale:** Comic Sans is approachable, playful, and removes the corporate/serious vibe. Perfect for a fun tool.

### Font Weights
- **Body:** 700 (bold by default for readability)
- **Headings:** 900 (black weight for emphasis)

### Sizes
- **Hero:** 5xl-7xl (48-72px)
- **Headings:** 3xl-5xl (30-48px)
- **Body:** base-xl (16-20px)
- **Small:** sm-xs (12-14px)

---

## SHADOWS (Multi-Layer)

### neo-shadow-chaos (3-layer)
```css
box-shadow: 
  3px 3px 0px #000000,    /* Black base */
  6px 6px 0px #84cc16,    /* Lime offset */
  9px 9px 0px #000000;    /* Black outer */
```
**Use:** Primary CTAs, hero elements

### neo-shadow-double (2-layer)
```css
box-shadow: 
  4px 4px 0px #000000,
  8px 8px 0px #fbbf24;    /* Yellow */
```
**Use:** Cards, containers

### neo-shadow-triple (3-layer cyan)
```css
box-shadow: 
  2px 2px 0px #000000,
  4px 4px 0px #22d3ee,    /* Cyan */
  6px 6px 0px #000000;
```
**Use:** Secondary elements

### neo-shadow-pink (2-layer)
```css
box-shadow: 
  4px 4px 0px #000000,
  8px 8px 0px #f472b6;    /* Pink */
```
**Use:** Tertiary elements

---

## ROTATION & CHAOS

### Rotation Classes
```css
.rotate-chaos-1 { transform: rotate(-1deg); }
.rotate-chaos-2 { transform: rotate(1deg); }
.rotate-chaos-3 { transform: rotate(-2deg); }
```

**Hover:** Rotate to 0° + scale(1.02-1.05)  
**Purpose:** Creates dynamic, hand-placed feel

---

## BORDERS

### Thickness
- **Thin:** 2-3px (labels, badges)
- **Standard:** 4-5px (cards, buttons)
- **Thick:** 6px (hero elements, primary CTAs)

**Style:** Always solid black, no radius (sharp corners)

---

## STICKERS & BADGES

### Sticker Class
```css
.sticker {
  display: inline-block;
  transform: rotate(-8deg);
  animation: float 3s ease-in-out infinite;
}
```

**Use:** Emoji, labels, decorative elements  
**Examples:**
- "NEW!" badge (yellow, rotated 12°)
- "STEP 1" badge (cyan, rotated -12°)
- Floating emoji (🎬, 📹, ⚡, ✨)

---

## ANIMATIONS

### Float (Stickers)
```css
@keyframes float {
  0%, 100% { transform: rotate(-8deg) translateY(0px); }
  50%      { transform: rotate(-8deg) translateY(-5px); }
}
```

### Wiggle (Errors)
```css
@keyframes wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}
```

### Pulse Glow (Loading)
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0px rgba(132, 204, 22, 0.4); }
  50%      { box-shadow: 0 0 20px rgba(132, 204, 22, 0.8); }
}
```

---

## BUTTONS

### Primary CTA
```css
background: linear-gradient(to right, #84cc16, #fbbf24);
border: 6px solid #000;
box-shadow: neo-shadow-chaos;
transform: rotate(-1deg);
```

**Hover:** `rotate(0deg) scale(1.02)`  
**Active:** `translate(4px, 4px)` (press-down effect)

### Secondary
```css
background: #ffffff;
border: 4px solid #000;
box-shadow: neo-shadow-double;
```

### Tertiary
```css
background: <accent-color> (pink, cyan, purple);
border: 4px solid #000;
```

---

## PROGRESS BARS

### Style
```css
background: repeating-linear-gradient(
  45deg,
  #84cc16, #84cc16 20px,
  #fbbf24, #fbbf24 40px
);
/* Diagonal stripes */
```

**Alternative:** Multi-color gradient (lime → yellow → cyan)

---

## RANGE SLIDERS

### Thumb
```css
width: 40px;
height: 40px;
background: #84cc16;
border: 4px solid #000;
border-radius: 50%;  /* ONLY element with border-radius */
box-shadow: 3px 3px 0px #000;
cursor: grab;
```

**Active:** `cursor: grabbing` + darker lime

---

## LAYOUT

### Spacing Scale
- **6:** 24px (large gaps between sections)
- **5:** 20px (medium gaps)
- **4:** 16px (standard gaps)
- **3:** 12px (compact gaps)

### Rotation per Section
- **Preloader:** -1°
- **Upload:** 1°, -2° (varied)
- **Trim:** -2°, 1°, -1°
- **Converting:** 1°
- **Result:** -1°, 2°, 1°

---

## PATTERNS

### Timeline (Trim Screen)
```css
background: repeating-linear-gradient(
  45deg,
  #84cc16, #84cc16 10px,
  #fbbf24, #fbbf24 20px
);
```

### Scribble Underline
```css
background: repeating-linear-gradient(
  90deg,
  #84cc16 0px, #84cc16 8px,
  transparent 8px, transparent 12px
);
```

---

## ACCESSIBILITY (MAINTAINED)

### Focus States
```css
outline: 4px dashed #84cc16;  /* Dashed for playful feel */
outline-offset: 4px;
```

### Touch Targets
- Minimum: 44x44px (WCAG 2.1 Level AA)
- Slider thumbs: 40x40px
- Buttons: 48px+ height

### Color Contrast
- Black on white: 21:1 ✓
- Black on lime: 11.5:1 ✓
- Black on yellow: 13.2:1 ✓

---

## COMPONENT EXAMPLES

### Badge/Tag
```tsx
<span className="bg-pink-200 border-2 border-black px-3 py-1 text-sm font-black rotate-chaos-1">
  MP4
</span>
```

### Card
```tsx
<div className="bg-white border-5 border-black p-6 neo-shadow-double rotate-chaos-2">
  Content
</div>
```

### Sticker Label
```tsx
<div className="absolute -top-3 -right-3 bg-yellow-400 border-3 border-black px-3 py-1 rotate-12 sticker">
  <span className="text-xs font-black">NEW!</span>
</div>
```

---

## DO's AND DON'Ts

### ✓ DO
- Use rotation (-2° to +2°)
- Mix accent colors
- Add emoji liberally
- Layer shadows (2-3 layers)
- Float/wiggle animations
- Bold typography

### ✗ DON'T
- Use border-radius (except slider thumbs)
- Use subtle shadows
- Use light font weights
- Perfectly align elements
- Use muted colors
- Hide personality

---

## INSPIRATION SOURCES

- **Neo-Brutalism:** Sharp edges, bold borders, flat colors
- **Vaporwave:** Playful gradients, chaotic composition
- **90s Web:** Comic Sans, bright colors, stickers
- **Street Art:** Layered shadows, rotation, texture

---

**Result:** A design that feels **fun**, **approachable**, and **memorable** while maintaining professional **usability** and **accessibility**.
