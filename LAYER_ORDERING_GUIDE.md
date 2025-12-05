# Layer Ordering & Null Layers Guide

## 🎯 Overview

Your Rive Clone now supports professional layer management including:
- **Z-Order/Stacking Order**: Control which layers appear in front or behind
- **Null Layers (Bones/Groups)**: Invisible containers for organizing and animating
- **Hierarchical Parenting**: Parent-child relationships with transform inheritance

---

## 1. Layer Ordering (Z-Order / Stacking Order)

### How It Works

Think of layers as a **stack of transparent sheets**:

```
Top of List = FRONT (rendered last, on top)
   ↑
   │
   └── Layer 3 (Circle - drawn last,  appears in front)
   └── Layer 2 (Rectangle - drawn second)
   └── Layer 1 (Background - drawn first, appears behind)
Bottom of List = BACK (rendered first, behind)
```

### Rendering Order

- **Bottom-Up Rendering**: Shapes are drawn from the bottom of the array upward
- **Array Index**: `shapes[0]` is drawn first (back), `shapes[length-1]` is drawn last (front)
- **Hierarchy Display**: The Hierarchy panel shows **reversed order** - "Front on Top" for easier visualization

### In Practice

```javascript
shapes = [
    { id: 1, type: 'rect', name: 'Background' },  // Drawn FIRST (back)
    { id: 2, type: 'ellipse', name: 'Middle' },   // Drawn SECOND
    { id: 3, type: 'rect', name: 'Foreground' }   // Drawn LAST (front)
]

// Visual result: Foreground covers Middle covers Background
```

---

## 2. Parenting & Hierarchy Tree

### Parent-Child Relationships

Creating a hierarchy forms a **tree structure**:

```
Root (Artboard)
├── Body (Null)
│   ├── Torso (Shape)
│   ├── Arm_Left (Null)
│   │   ├── UpperArm (Shape)
│   │   └── Forearm (Null)
│   │       └── Forearm_Visual (Shape)
│   └── Arm_Right (Null)
└── Background (Shape)
```

### What Parenting Does

1. **Transformation Inheritance**:
   - Child inherits parent's position, rotation, scale
   - Move parent → all children move maintaining relative position
   - Rotate parent → children rotate around parent's center
   - Scale parent → children scale proportionally

2. **Local vs World Coordinates**:
   ```
   Child's World Position = Parent's World Transform + Child's Local Offset
   
   Example:
   Parent at (100, 100), rotated 45°
   Child at (150, 100) in world coordinates
   Child's local offset: (50, 0) from parent
   
   When parent rotates:
   - Child maintains (50, 0) local offset
   - But world position changes as it rotates around parent
   ```

3. **Grouped Behavior**:
   - Hiding parent → all children hidden
   - Transforming parent → affects entire subtree
   - Perfect for character rigging and complex animations

---

## 3. Null Layers / Group Nodes

### What is a Null?

A **Null** (also called "Bone", "Empty", or "Group Node") is a layer with:
- ❌ **No visual appearance** (invisible on canvas)
- ✅ **Full transform properties** (position, rotation, scale)
- ✅ **Can be a parent** to other layers
- ✅ **Selectable** with transparent hit area

### Why Use Nulls?

#### 1. **Organizational Parents**
Group multiple visual layers under a single control point:

```
Character (Null)
├── Head (Shape)  
├── Body (Shape)
└── Legs (Shape)

// Animate the "Character" null → entire character moves
```

#### 2. **Clean Pivot Points**
Control rotation origins precisely:

```
❌ Without Null:
Forearm (Shape) - rotates around its own center (wrong!)

✅ With Null:
Elbow (Null, placed at elbow joint)
└── Forearm (Shape)

// Rotate the "Elbow" null → forearm rotates around elbow (correct!)
```

#### 3. **Animation Flexibility**
Separate control from visuals:

```
Swing (Null - animated back and forth)
└── Pendulum_Visual (Shape - never directly animated)

// All animation logic on the null
// Swap visuals without redoing animation
```

#### 4. **IK Chains & Rigging**
Build complex skeletal systems:

```
Shoulder (Null)
└── UpperArm (Null)
    └── Elbow (Null)
        └── Forearm (Null)
            └── Wrist (Null)
                └── Hand (Shape)
```

---

## 4. Practical Example: Building an Arm

### Step 1: Create the Structure

1. **Add Null for Shoulder** (`+` button in Hierarchy)
   - Name: "Shoulder_Null"
   - Position: At shoulder joint

2. **Add Rectangle for Upper Arm**
   - Name: "UpperArm_Shape"
   - Draw from shoulder to elbow
   - **Parent to**: Shoulder_Null

3. **Add Null for Elbow**
   - Name: "Elbow_Null"  
   - Position: At elbow joint
   - **Parent to**: Shoulder_Null

4. **Add Rectangle for Forearm**
   - Name: "Forearm_Shape"
   - Draw from elbow to wrist
   - **Parent to**: Elbow_Null

### Step 2: Hierarchy Structure

```
Root (Artboard)
└── Shoulder_Null
    ├── UpperArm_Shape
    └── Elbow_Null
        └── Forearm_Shape
```

### Step 3: Animation

**Rotate entire arm**:
- Select `Shoulder_Null`
- Rotate it → UpperArm_Shape, Elbow_Null, and Forearm_Shape all follow

**Bend elbow**:
- Select `Elbow_Null`
- Rotate it → Only Forearm_Shape follows
- UpperArm_Shape stays put (not a child of Elbow_Null)

---

## 5. How It All Works Together

### Render Order + Parenting

1. **Within Same Parent**: Array order determines stacking
   ```
   Parent (Null)
   ├── Child_Back (drawn first)
   └── Child_Front (drawn last, on top)
   ```

2. **Cross-Hierarchy**: Parent context matters
   ```
   Parent_A (Null) - rendered first (behind)
   └── Child_A (always behind Parent_B's children)
   
   Parent_B (Null) - rendered second (front)
   └── Child_B (always in front of Parent_A's children)
   ```

### Transform Inheritance Flow

```
1. Root Transform (Artboard): Identity (no transform)
2. Parent Transform: Position + Rotation + Scale
3. Child Local Offset: Relative to parent
4. Child World Transform: Parent World × Child Local
```

---

## 6. Using the System

### Creating a Null

1. Click the **`+` Group button** in Hierarchy panel header
2. A new "Null" layer appears at canvas center
3. Null is **invisible** but shows dashed box when selected

### Parenting Layers

1. **Drag & Drop** in Hierarchy:
   - Drag any layer
   - Drop in **middle** of target layer
   - Layer becomes child of target

2. **Visual Feedback**:
   - Blue glow = will nest inside
   - Indentation shows parent-child relationship

### Reordering Layers (Z-Order)

**Drag & Drop** in Hierarchy:
- Drop **before** (top edge) → moves in front
- Drop **after** (bottom edge) → moves behind
- Remember: Top of list = Front visually

### Animating with Nulls

1. **Select Null** (invisible control point)
2. **Transform it** (move, rotate, scale)
3. **All children follow** automatically
4. **Keyframe the null**, not individual shapes

---

## 7. Best Practices

### Naming Convention

```
Character_Root (Null)
├── Character_Head (Null)
│   └── Head_Visual (Shape)
├── Character_Body (Null)
│   ├── Body_Visual (Shape)
│   └── Character_Arm_L (Null)
│       ├── Arm_L_Upper (Null)
│       │   └── Upper_Visual (Shape)
│       └── Arm_L_Forearm (Null)
                └── Forearm_Visual (Shape)
```

**Naming Tips**:
- Nulls: `[Object]_Null` or `[Joint]_Bone`
- Shapes: `[Part]_Visual` or `[Part]_Shape`
- Use prefixes for grouping: `Character_`, `UI_`, `BG_`

### Organization

- **One Null per Joint/Pivot Point**
- **Visual shapes are always children** of nulls
- **Keep hierarchy shallow when possible** (easier debugging)
- **Use nulls for animation logic**, keep shapes simple

### Layer Ordering

- **Background elements** at bottom of array
- **Character/Main content** in middle
- **UI/Overlay elements** at top of array
- **Within character**: Body parts that overlap need careful ordering

---

## 8. Summary

| Feature | Purpose | How It Works |
|---------|---------|--------------|
| **Z-Order** | Control visibility stacking | Array position = render order |
| **Parenting** | Group & control transforms | Child inherits parent transforms |
| **Nulls** | Invisible pivot/control points | Transform container, no visual |
| **Hierarchy** | Organize & animate complex scenes | Tree structure with inheritance |

**Result**: Professional-grade scene organization matching Rive, After Effects, and other animation tools! 🎨

---

## 🎬 Quick Start Workflow

1. **Plan Structure**: Sketch your hierarchy on paper first
2. **Create Nulls**: Add null for each joint/pivot point
3. **Create Visuals**: Draw actual shapes
4. **Parent Shapes**: Drag shapes onto appropriate nulls
5. **Order Layers**: Arrange Z-order for proper overlap
6. **Animate Nulls**: Transform nulls, not individual shapes
7. **Test`: Move parents, watch children follow!

Your Rive Clone now has professional layer management! 🚀
