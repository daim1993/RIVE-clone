# Distribution Feature

## Overview
I've added horizontal and vertical distribution functionality to your RIVE clone application. This allows you to evenly space selected layers/shapes.

## What Was Added

### 1. Distribution Functions in `App.js`

Two new functions were added:
- **`handleDistributeHorizontal()`** - Evenly distributes selected shapes horizontally
- **`handleDistributeVertical()`** - Evenly distributes selected shapes vertically

### How Distribution Works

The distribution algorithm:
1. Requires at least **3 selected shapes** to work
2. Sorts shapes by position (left-to-right for horizontal, top-to-bottom for vertical)
3. Keeps the **outermost shapes** (leftmost/rightmost or topmost/bottommost) in place
4. Calculates the total space between the outermost shapes
5. Evenly distributes the **intermediate shapes** to create equal spacing

**Example (Horizontal):**
```
Before:
[A]    [B]  [C]           [D]

After:
[A]     [B]     [C]     [D]
```

### 2. Toolbar Updates

The toolbar now shows distribution buttons when:
- You are in **Design mode**
- You have **3 or more shapes selected**

The distribution buttons appear with these icons:
- **Horizontal Distribution** (⫴) - Distributes shapes evenly left to right
- **Vertical Distribution** (⫶) - Distributes shapes evenly top to bottom

## How to Use

1. **Open the application** in your browser (http://localhost:8080)
2. **Create multiple shapes** (rectangles, circles, etc.)
3. **Select 3 or more shapes** by:
   - Clicking and dragging to select multiple
   - Or Ctrl+Click to add shapes to selection
4. **Click the distribution button** in the toolbar:
   - Click the horizontal distribution icon to space shapes evenly left-to-right
   - Click the vertical distribution icon to space shapes evenly top-to-bottom

## Technical Implementation

### Files Modified:
1. **`js/App.js`**
   - Added `handleDistributeHorizontal()` function (lines 612-659)
   - Added `handleDistributeVertical()` function (lines 661-708)
   - Updated context to expose these functions (line 784)
   - Updated Toolbar props to pass distribution handlers (lines 914-916)

2. **`js/components/Toolbar.js`**
   - Added distribution button support
   - Buttons conditionally render when 3+ shapes are selected
   - Added proper props: `onDistributeHorizontal`, `onDistributeVertical`, `selection`

### Icons Used:
- `Icons.DistributeHorizontal` - Already existed in `icons.js`
- `Icons.DistributeVertical` - Already existed in `icons.js`

## Features & Benefits

✅ **Smart Distribution** - Only the intermediate shapes move; outermost shapes stay in place
✅ **Conditional UI** - Distribution buttons only appear when relevant (3+ selections)
✅ **Undo Support** - Distribution actions are recorded in history for undo/redo
✅ **Works with Any Shape Type** - Compatible with rectangles, circles, paths, images, and groups

## Testing Tips

To test the distribution feature:

1. Create 4-5 rectangles at random positions
2. Select all of them (Ctrl+A or drag select)
3. Notice the distribution icons appear in the toolbar
4. Click horizontal distribution - shapes should align with equal horizontal spacing
5. Try vertical distribution next
6. Use Ctrl+Z to undo if needed

Enjoy your new layer distribution feature! 🎨
