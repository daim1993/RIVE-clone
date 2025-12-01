# Glass Blur Implementation Note

## Current Limitation

SVG filters with `BackgroundImage` and `feImage` have significant browser compatibility issues and don't work reliably for creating true backdrop blur effects in SVG.

## Recommended Solution

For a true glass blur effect that blurs objects behind a shape (like Framer), you would need to:

1. **Use CSS `backdrop-filter`** - This is the modern web standard for backdrop blur
   - Requires rendering shapes as HTML/CSS elements instead of SVG
   - Or use a hybrid approach with HTML overlays

2. **Use Canvas API** - Render to HTML5 Canvas with manual blur implementation
   - Capture background pixels
   - Apply blur algorithm
   - Composite with shape

3. **Use WebGL/Three.js** - For advanced rendering with custom shaders
   - Full control over rendering pipeline
   - Can implement custom backdrop blur shaders

## Current Implementation

The current implementation uses SVG filters which provide:
- ✅ Regular blur (blurs the shape itself)
- ⚠️ Limited glass effect (attempts backdrop blur but browser-dependent)

## To Get True Backdrop Blur

You would need to refactor the rendering system to use one of:
- CSS with `backdrop-filter: blur(10px)` on HTML elements
- Canvas 2D API with custom blur implementation  
- WebGL with fragment shaders

This would be a significant architectural change to the editor.

## Workaround

For now, users can:
1. Use semi-transparent fills (`rgba(255,255,255,0.2)`)
2. Layer shapes manually to create depth
3. Use the regular blur effect for a frosted appearance

