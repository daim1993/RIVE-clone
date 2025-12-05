# Hierarchy Drag & Drop Guide

## Creating Parent-Child Relationships

Your Rive Clone already has **full drag-and-drop functionality** to create parent-child relationships in the Hierarchy panel!

### How to Use

1. **Start Dragging**
   - Click and hold on any object in the Hierarchy panel
   - The item will appear slightly transparent with a dashed border

2. **Drop Zones**
   When you drag an item over another item, there are **3 drop zones**:
   
   - **Top 25%** → Drop **BEFORE** (insert as sibling above)
     - Visual: Blue line appears on TOP
   
   - **Middle 50%** → Drop **INSIDE** (nest as child) ✨
     - Visual: Entire item highlights with blue glow
   
   - **Bottom 25%** → Drop **AFTER** (insert as sibling below)
     - Visual: Blue line appears on BOTTOM

3. **Release to Apply**
   - Release the mouse button to complete the action
   - The hierarchy will update immediately
   - Children will appear indented under their parent

### Visual Feedback

- **Dragging Item**: Semi-transparent with dashed blue border
- **Drop Before/After**: Blue glowing line on top/bottom edge
- **Drop Inside**: Blue highlighted background with glow effect
- **Children**: Indented with a vertical line connecting to parent

### Tips

- **Nesting Tip**: Aim for the middle of an item to make it a child
- **Reordering Tip**: Aim for the top/bottom edges to change order
- **Group Objects**: Create a Group (`+` button in Hierarchy header) to organize multiple objects
- **Multi-level Nesting**: You can nest children inside children for complex hierarchies
- **Prevent Invalid Nesting**: The system prevents you from dropping a parent inside its own child

### Example Workflow

1. Create multiple shapes on the canvas
2. In Hierarchy, drag "Rectangle 1" onto the center of "Circle 1"
3. Rectangle 1 becomes a child of Circle 1
4. Now when you move Circle 1, Rectangle 1 moves with it!

### Keyboard Shortcuts

While working with hierarchy:
- **Delete/Backspace**: Delete selected items
- **Ctrl+C**: Copy selected item
- **Ctrl+V**: Paste copied item
- **Ctrl+Shift+Click**: Multi-select items

---

*The drag-and-drop logic is implemented in:*
- `js/components/Hierarchy.js` (lines 63-126)
- `js/App.js` - `handleMoveShape` function (lines 532-564)
