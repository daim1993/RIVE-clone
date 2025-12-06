const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

const AppContext = createContext(null);

const HierarchyWrapper = () => {
    const { shapes, selection, setSelection, handleMoveShape, handleReparent, handleAddGroup } = useContext(AppContext);
    const Hierarchy = window.Hierarchy;
    return (
        <Hierarchy
            shapes={shapes}
            selection={selection}
            setSelection={setSelection}
            onMoveShape={handleMoveShape}
            onReparent={handleReparent}
            onAddGroup={handleAddGroup}
        />
    );
};

const PropertiesWrapper = () => {
    const { selection, shapes, updateShapes, canvasSize, updateShape } = useContext(AppContext);
    const Properties = window.Properties;
    return (
        <Properties
            selection={selection}
            shapes={shapes}
            updateShapes={updateShapes}
            canvasSize={canvasSize}
            updateShape={updateShape}
        />
    );
};

const TimelineWrapper = () => {
    const {
        isTimelineVisible, setIsTimelineVisible, isPlaying, setIsPlaying, currentTime, setCurrentTime,
        duration, setDuration, shapes, selection, keyframes, addKeyframe, deleteKeyframe,
        animations, activeAnimationId, setActiveAnimationId, addAnimation,
        smInputs, setSmInputs, smTransitions, handleUpdateTransition, selectedTransitionId,
        updateKeyframeTime, fireTrigger, showConfirm
    } = useContext(AppContext);
    const Timeline = window.Timeline;

    return (
        <Timeline
            isVisible={isTimelineVisible}
            onToggle={() => setIsTimelineVisible(!isTimelineVisible)}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
            shapes={shapes}
            selection={selection}
            keyframes={keyframes}
            addKeyframe={addKeyframe}
            deleteKeyframe={deleteKeyframe}
            animations={animations}
            activeAnimationId={activeAnimationId}
            setActiveAnimationId={setActiveAnimationId}
            addAnimation={addAnimation}
            updateKeyframeTime={updateKeyframeTime}
            // State Machine Props
            smInputs={smInputs}
            setSmInputs={setSmInputs}
            selectedTransition={smTransitions.find(t => t.id === selectedTransitionId)}
            onUpdateTransition={handleUpdateTransition}
            fireTrigger={fireTrigger}
            showConfirm={showConfirm}
        />
    );
};

const CanvasWrapper = () => {
    const {
        shapes, selection, setSelection, tool, addShape, updateShape, updateShapes, recordHistory,
        canvasSize, setCanvasSize, mode, activeView, setActiveView, animations,
        smStates, smTransitions, handleAddState, handleAddTransition, setSelectedNodeId, selectedNodeId,
        setSelectedTransitionId, selectedTransitionId, updateKeyframeTime
    } = useContext(AppContext);

    const Canvas = window.Canvas;
    const StateMachineEditor = window.StateMachineEditor;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* View Switcher (Only in Animate Mode) */}
            {mode === 'animate' && (
                <div style={{
                    height: '32px',
                    background: 'var(--bg-panel)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    gap: '8px'
                }}>
                    <button
                        className={`btn ${activeView === 'canvas' ? 'active' : ''}`}
                        onClick={() => setActiveView('canvas')}
                        style={{ fontSize: '11px', padding: '4px 8px', background: activeView === 'canvas' ? 'var(--bg-input)' : 'transparent' }}
                    >
                        Canvas
                    </button>
                    <button
                        className={`btn ${activeView === 'graph' ? 'active' : ''}`}
                        onClick={() => setActiveView('graph')}
                        style={{ fontSize: '11px', padding: '4px 8px', background: activeView === 'graph' ? 'var(--bg-input)' : 'transparent' }}
                    >
                        State Machine
                    </button>
                </div>
            )}

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* Canvas View */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    visibility: activeView === 'canvas' ? 'visible' : 'hidden'
                }}>
                    <Canvas
                        shapes={shapes}
                        selection={selection}
                        setSelection={setSelection}
                        tool={tool}
                        addShape={addShape}
                        updateShape={updateShape}
                        updateShapes={updateShapes}
                        onUpdateEnd={() => recordHistory(shapes, animations)}
                        canvasSize={canvasSize}
                        setCanvasSize={setCanvasSize}
                        mode={mode}
                    />
                </div>

                {/* State Machine View */}
                {mode === 'animate' && activeView === 'graph' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <StateMachineEditor
                            states={smStates}
                            transitions={smTransitions}
                            onAddState={handleAddState}
                            onAddTransition={handleAddTransition}
                            onSelectNode={setSelectedNodeId}
                            selectedNodeId={selectedNodeId}
                            onSelectTransition={setSelectedTransitionId}
                            selectedTransitionId={selectedTransitionId}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const App = () => {
    // Access components from window inside the component
    const Icons = window.Icons;
    const StateMachineEditor = window.StateMachineEditor;
    const Hierarchy = window.Hierarchy;
    const Properties = window.Properties;
    const Canvas = window.Canvas;
    const Timeline = window.Timeline;
    const MenuBar = window.MenuBar;
    const Toolbar = window.Toolbar;
    const Layout = window.Layout;

    // Easing Functions
    const Easing = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        cubicBezier: (p1x, p1y, p2x, p2y) => t => t, // Placeholder
        spring: (t) => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        }
    };

    const [shapes, setShapes] = useState([
        { id: 1, type: 'rect', x: 100, y: 100, width: 100, height: 100, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Rectangle 1' },
        { id: 2, type: 'ellipse', x: 300, y: 200, width: 100, height: 100, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Circle 1' }
    ]);
    const [selection, setSelection] = useState([]);
    const [tool, setTool] = useState('select');
    const [mode, setMode] = useState('design');
    const [isPlaying, setIsPlaying] = useState(false);
    const fileInputRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [animations, setAnimations] = useState([
        { id: 1, name: 'Idle', duration: 5000, keyframes: [] }
    ]);
    const [activeAnimationId, setActiveAnimationId] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [activeView, setActiveView] = useState('canvas'); // 'canvas' or 'graph'

    const activeAnimation = animations.find(a => a.id === activeAnimationId) || animations[0];
    const duration = activeAnimation?.duration || 0;
    const keyframes = activeAnimation?.keyframes || [];

    const setDuration = (newDuration) => {
        const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, duration: newDuration } : a);
        setAnimations(newAnimations);
        recordHistory(shapes, newAnimations);
    };

    const setKeyframes = (newKeyframes) => {
        const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
        setAnimations(newAnimations);
    };

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [clipboard, setClipboard] = useState(null);

    // State Machine Data
    const [smStates, setSmStates] = useState([
        { id: 'entry', name: 'Entry', x: 50, y: 50 },
        { id: 'exit', name: 'Exit', x: 500, y: 50 },
        { id: 'any', name: 'Any State', x: 50, y: 300 },
        { id: 'idle', name: 'Idle', x: 250, y: 150, animationId: 1 },
        { id: 'run', name: 'Run', x: 250, y: 300, animationId: null }
    ]);
    const [smTransitions, setSmTransitions] = useState([
        { id: 1, from: 'entry', to: 'idle', conditions: [] }
    ]);
    const [smInputs, setSmInputs] = useState([
        { id: 1, name: 'isHovering', type: 'boolean', value: false },
        { id: 2, name: 'speed', type: 'number', value: 0 },
        { id: 3, name: 'jump', type: 'trigger', value: false }
    ]);
    const [currentStateId, setCurrentStateId] = useState('entry');
    const [selectedTransitionId, setSelectedTransitionId] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        type: 'confirm'
    });

    const showConfirm = (message, onConfirm, title = 'Confirm', onCancel = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => {
                if (onCancel) onCancel();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            type: 'confirm'
        });
    };

    const showAlert = (message, title = 'Alert') => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
            onCancel: null,
            type: 'alert'
        });
    };

    // Trigger Logic
    const fireTrigger = (inputId) => {
        setSmInputs(prev => prev.map(i => i.id === inputId ? { ...i, value: true } : i));
    };

    // Animation Loop
    useEffect(() => {
        let animationFrame;
        let start = Date.now() - currentTime;

        const loop = () => {
            if (!isPlaying) return;

            // State Machine Logic
            // 0. Resolve Keyframes/Animation for CURRENT state (before transition? or after? Rive checks transitions first)

            // 1. Check Transitions
            // Priority: Any State -> Current State
            const anyStateTransitions = smTransitions.filter(t => t.from === 'any');
            const currentStateTransitions = smTransitions.filter(t => t.from === currentStateId);
            const possibleTransitions = [...anyStateTransitions, ...currentStateTransitions];

            let transitionTaken = null;

            for (const t of possibleTransitions) {
                // Determine if transition should be taken
                if (!t.conditions || t.conditions.length === 0) {
                    // Start/Immediate transition? Only valid for Entry really, or usually requires 'exit time' (not implemented yet).
                    // For now, if from 'entry' and no condition, take it.
                    if (t.from === 'entry') {
                        transitionTaken = t;
                        break;
                    }
                    continue;
                }

                // Check ALL conditions
                const allMet = t.conditions.every(cond => {
                    const input = smInputs.find(i => i.id === cond.inputId);
                    if (!input) return false;

                    switch (input.type) {
                        case 'boolean':
                            return input.value === (cond.value === 'true' || cond.value === true);
                        case 'trigger':
                            return input.value === true;
                        case 'number':
                            const val = Number(cond.value);
                            const currentVal = Number(input.value);
                            switch (cond.operator) {
                                case '==': return currentVal === val;
                                case '>': return currentVal > val;
                                case '<': return currentVal < val;
                                case '>=': return currentVal >= val;
                                case '<=': return currentVal <= val;
                                default: return false;
                            }
                        default: return false;
                    }
                });

                if (allMet) {
                    transitionTaken = t;
                    break;
                }
            }

            if (transitionTaken) {
                setCurrentStateId(transitionTaken.to);
                start = Date.now(); // Reset time for new state

                // Consumed triggers? 
                // We typically consume triggers involved in the transition.
                // Or we reset ALL triggers at end of frame? Rive resets triggers at end of frame or after evaluation.
                // We'll reset triggers that were TRUE.
                // Actually, due to React state setting in loop, we need to be careful.
                // `fireTrigger` sets state. If we reset here, we might loop?
                // For now, let's assume we can setSmInputs here safely if we use functional update?
                // No, calling setState in loop is bad if it causes re-render loop.
                // BUT `loop` is inside useEffect dependency on `isPlaying`.
                // We should only reset triggers if we detect they are true.

                // ideally we handle trigger consumption.
            }

            // Cleanup Triggers (if any were true, set them to false)
            // This logic is tricky in React loop. 
            // We'll rely on a separate effect or just modify the Ref if possible? 
            // For now, let's just NOT reset inside the loop to avoid infinite re-renders.
            // We will implement a 'consumeTrigger' that updates the state once.

            if (transitionTaken) {
                // Check if any conditions were triggers and reset them
                const triggerConditions = transitionTaken.conditions.filter(c => {
                    const inp = smInputs.find(i => i.id === c.inputId);
                    return inp && inp.type === 'trigger';
                });
                if (triggerConditions.length > 0) {
                    setSmInputs(prev => prev.map(inp => {
                        if (inp.type === 'trigger' && inp.value === true) {
                            return { ...inp, value: false };
                        }
                        return inp;
                    }));
                }
            }


            // 2. Get Active Animation from Current State
            const currentState = smStates.find(s => s.id === currentStateId);
            const currentAnimId = currentState?.animationId;
            const currentAnim = animations.find(a => a.id === currentAnimId);

            if (!currentAnim) {
                // Still need to tick triggers?
                if (!transitionTaken) {
                    // If we didn't transition, we might still want to clear triggers? 
                    // Triggers usually persist until consumed by a transition? 
                    // Or they last 1 frame? Rive triggers are "Fire" and stay active until consumed or explicitly reset?
                    // Usually "Fire" means "Evaluate in next update".
                }
                animationFrame = requestAnimationFrame(loop);
                return;
            }

            const now = Date.now();
            let newTime = (now - start);
            const animDuration = currentAnim.duration || 5000;

            if (newTime >= animDuration) {
                newTime = 0;
                start = now;
            }

            setCurrentTime(newTime);
            applyAnimationAt(newTime, currentAnim);

            animationFrame = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            start = Date.now() - currentTime;
            loop();
        } else {
            cancelAnimationFrame(animationFrame);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, activeAnimationId, animations, smStates, smTransitions, smInputs, currentStateId]);
    // Layout State - Separate states for design and animate modes
    const defaultDesignLayout = {
        id: 'root',
        type: 'container',
        direction: 'row',
        size: 100,
        children: [
            { id: 'hierarchy', type: 'component', component: 'Hierarchy', title: 'Hierarchy', size: 20 },
            { id: 'canvas', type: 'component', component: 'Canvas', title: 'Canvas', size: 60 },
            { id: 'properties', type: 'component', component: 'Properties', title: 'Properties', size: 20 }
        ]
    };

    const defaultAnimateLayout = {
        id: 'root',
        type: 'container',
        direction: 'col',
        size: 100,
        children: [
            {
                id: 'main-row',
                type: 'container',
                direction: 'row',
                size: 70,
                children: [
                    { id: 'hierarchy', type: 'component', component: 'Hierarchy', title: 'Hierarchy', size: 20 },
                    { id: 'canvas', type: 'component', component: 'Canvas', title: 'Canvas', size: 60 },
                    { id: 'properties', type: 'component', component: 'Properties', title: 'Properties', size: 20 }
                ]
            },
            { id: 'timeline', type: 'component', component: 'Timeline', title: 'Timeline', size: 30 }
        ]
    };

    const [designLayout, setDesignLayout] = useState(defaultDesignLayout);
    const [animateLayout, setAnimateLayout] = useState(defaultAnimateLayout);
    const [layout, setLayout] = useState(defaultDesignLayout);

    useEffect(() => {
        if (mode === 'animate') {
            setLayout(animateLayout);
            setIsTimelineVisible(true);
        } else {
            setLayout(designLayout);
            setIsTimelineVisible(false);
        }
    }, [mode, designLayout, animateLayout]);

    const handleLayoutChange = (newLayout) => {
        if (mode === 'animate') {
            setAnimateLayout(newLayout);
        } else {
            setDesignLayout(newLayout);
        }
        setLayout(newLayout);
    };


    // History Management
    const recordHistory = (newShapes, newAnimations) => {
        const snapshot = {
            shapes: JSON.parse(JSON.stringify(newShapes)),
            animations: JSON.parse(JSON.stringify(newAnimations || animations))
        };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(snapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    useEffect(() => {
        if (history.length === 0 && shapes.length > 0) {
            recordHistory(shapes, animations);
        }
    }, []);

    const undo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const snapshot = history[prevIndex];
            setShapes(snapshot.shapes);
            setAnimations(snapshot.animations);
            setHistoryIndex(prevIndex);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const snapshot = history[nextIndex];
            setShapes(snapshot.shapes);
            setAnimations(snapshot.animations);
            setHistoryIndex(nextIndex);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selection.length > 0) {
                    const newShapes = shapes.filter(s => !selection.includes(s.id));
                    setShapes(newShapes);
                    setSelection([]);
                    recordHistory(newShapes, animations);
                }
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'i') {
                    e.preventDefault();
                    const allIds = shapes.map(s => s.id);
                    const newSelection = allIds.filter(id => !selection.includes(id));
                    setSelection(newSelection);
                }
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                }
                if (e.key === 'c') {
                    e.preventDefault();
                    if (selection.length > 0) {
                        const shapeToCopy = shapes.find(s => s.id === selection[0]);
                        setClipboard(shapeToCopy);
                    }
                }
                if (e.key === 'v') {
                    e.preventDefault();
                    if (clipboard) {
                        const newShape = {
                            ...clipboard,
                            id: Date.now(),
                            x: clipboard.x + 20,
                            y: clipboard.y + 20,
                            name: clipboard.name + ' Copy'
                        };
                        const newShapes = [...shapes, newShape];
                        setShapes(newShapes);
                        setSelection([newShape.id]);
                        recordHistory(newShapes, animations);
                    }
                }
            }
        };

        const handleKeyPress = (e) => {
            if (e.key === 'k' && selection.length > 0 && mode === 'animate') {
                selection.forEach(selId => {
                    const selectedShape = shapes.find(s => s.id === selId);
                    if (selectedShape) {
                        addKeyframe({
                            shapeId: selId,
                            time: currentTime,
                            interpolation: 'linear',
                            properties: {
                                x: selectedShape.x,
                                y: selectedShape.y,
                                width: selectedShape.width,
                                height: selectedShape.height,
                                rotation: selectedShape.rotation || 0,
                                opacity: selectedShape.opacity || 1
                            }
                        });
                    }
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keypress', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keypress', handleKeyPress);
        };
    }, [shapes, selection, clipboard, history, historyIndex, mode, currentTime]);

    // Refs for Animation Loop
    const shapesRef = useRef(shapes);
    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);

    // Interpolation Logic
    const applyAnimationAt = (time, anim) => {
        if (!anim) return;

        const currentKeyframes = anim.keyframes || [];
        const updates = [];
        const currentShapes = shapesRef.current; // Use ref for latest shapes without triggering re-renders

        currentShapes.forEach(shape => {
            const shapeKeyframes = currentKeyframes
                .filter(kf => kf.shapeId === shape.id)
                .sort((a, b) => a.time - b.time);

            if (shapeKeyframes.length >= 1) {
                // Find prev and next keyframes
                let prevKf = null;
                let nextKf = null;

                // If time is before first keyframe, clamp to first
                if (time <= shapeKeyframes[0].time) {
                    prevKf = shapeKeyframes[0];
                    nextKf = shapeKeyframes[0];
                }
                // If time is after last keyframe, clamp to last
                else if (time >= shapeKeyframes[shapeKeyframes.length - 1].time) {
                    prevKf = shapeKeyframes[shapeKeyframes.length - 1];
                    nextKf = shapeKeyframes[shapeKeyframes.length - 1];
                }
                // Interpolate
                else {
                    for (let i = 0; i < shapeKeyframes.length - 1; i++) {
                        if (time >= shapeKeyframes[i].time && time < shapeKeyframes[i + 1].time) {
                            prevKf = shapeKeyframes[i];
                            nextKf = shapeKeyframes[i + 1];
                            break;
                        }
                    }
                }

                if (prevKf && nextKf) {
                    let progress = 0;
                    if (nextKf.time !== prevKf.time) {
                        progress = (time - prevKf.time) / (nextKf.time - prevKf.time);
                    }

                    const type = prevKf.interpolation || 'linear';
                    if (type && Easing[type]) {
                        progress = Easing[type](progress);
                    }

                    const interpolated = {};
                    // Check properties present in prevKf to interpolate
                    // If property is missing in nextKf, we should probably just use prevKf value? 
                    // For simplicity, we assume consistent properties for now or handle missing
                    Object.keys(prevKf.properties).forEach(key => {
                        const startVal = prevKf.properties[key];
                        const endVal = nextKf.properties[key] !== undefined ? nextKf.properties[key] : startVal;
                        interpolated[key] = startVal + (endVal - startVal) * progress;
                    });

                    updates.push({ id: shape.id, props: interpolated });
                }
            }
        });

        if (updates.length > 0) {
            updateShapes(updates);
        }
    };

    // Scrubbing Effect
    useEffect(() => {
        if (!isPlaying) {
            const currentAnim = animations.find(a => a.id === activeAnimationId);
            applyAnimationAt(currentTime, currentAnim);
        }
    }, [currentTime, isPlaying, activeAnimationId, animations, shapesRef]); // Added shapesRef to deps just in case, though not strictly needed as it's a ref

    const addShape = (shape) => {
        const newShape = { ...shape, id: Date.now() };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelection([newShape.id]);
        setTool('select');
        // Record history not needed here if we rely on onUpdateEnd or specific actions? 
        // But addShape is discrete.
        recordHistory(newShapes, animations);
    };

    const updateShape = (id, newProps) => {
        setShapes(prevShapes => prevShapes.map(s => s.id === id ? { ...s, ...newProps } : s));
    };

    const updateShapes = (updates) => {
        setShapes(prevShapes => {
            // Only create new array if there are actual changes
            let changed = false;
            const newShapes = prevShapes.map(s => {
                const update = updates.find(u => u.id === s.id);
                if (update) {
                    // Check if props really changed to avoid loops? 
                    // For now, just apply
                    changed = true;
                    return { ...s, ...update.props };
                }
                return s;
            });
            return changed ? newShapes : prevShapes;
        });
    };

    // ... move/reparent handlers ...



    // Expose updateKeyframeTime via Context or Props? 
    // It's passed to TimelineWrapper eventually.


    const handleMoveShape = (draggedId, targetId, position) => {
        if (draggedId === targetId) return;
        const draggedShape = shapes.find(s => s.id === draggedId);
        const targetShape = shapes.find(s => s.id === targetId);
        if (!draggedShape) return;

        let newShapes = [...shapes];
        newShapes = newShapes.filter(s => s.id !== draggedId);
        let newParentId = draggedShape.parentId;

        if (position === 'inside') {
            let current = targetShape;
            while (current) {
                if (current.id === draggedId) return;
                current = shapes.find(s => s.id === current.parentId);
            }
            newParentId = targetId;
            const updatedDraggedShape = { ...draggedShape, parentId: newParentId };
            newShapes.push(updatedDraggedShape);
        } else {
            newParentId = targetShape.parentId;
            const updatedDraggedShape = { ...draggedShape, parentId: newParentId };
            const targetIndex = newShapes.findIndex(s => s.id === targetId);

            if (position === 'before') {
                newShapes.splice(targetIndex + 1, 0, updatedDraggedShape);
            } else {
                newShapes.splice(targetIndex, 0, updatedDraggedShape);
            }
        }
        setShapes(newShapes);
        recordHistory(newShapes, animations);
    };

    const handleReparent = (childId, parentId) => {
        let current = shapes.find(s => s.id === parentId);
        while (current) {
            if (current.id === childId) return;
            current = shapes.find(s => s.id === current.parentId);
        }
        const newShapes = shapes.map(s => {
            if (s.id === childId) {
                return { ...s, parentId: parentId };
            }
            return s;
        });
        setShapes(newShapes);
        recordHistory(newShapes, animations);
    };

    const handleAddGroup = () => {
        const newGroup = {
            id: Date.now(),
            type: 'group',
            name: `Null ${shapes.length + 1}`,
            x: canvasSize.width / 2,
            y: canvasSize.height / 2,
            width: 50,
            height: 50,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true
        };
        addShape(newGroup);
    };

    const handleDistributeHorizontal = () => {
        if (selection.length < 3) return; // Need at least 3 objects to distribute

        const selectedShapes = shapes.filter(s => selection.includes(s.id));

        // Sort by x position (left to right)
        const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);

        // Calculate total space between leftmost and rightmost shapes
        const leftmost = sorted[0];
        const rightmost = sorted[sorted.length - 1];

        const leftEdge = leftmost.x;
        const rightEdge = rightmost.x + (rightmost.width || 0);
        const totalWidth = rightEdge - leftEdge;

        // Calculate total width of all shapes
        const shapesWidth = sorted.reduce((sum, shape) => sum + (shape.width || 0), 0);

        // Calculate spacing between shapes
        const spacing = (totalWidth - shapesWidth) / (sorted.length - 1);

        // Update positions
        const updates = [];
        let currentX = leftEdge;

        sorted.forEach((shape, index) => {
            if (index === 0 || index === sorted.length - 1) {
                // Don't move the first and last shapes
                currentX += (shape.width || 0) + spacing;
                return;
            }

            updates.push({
                id: shape.id,
                props: { x: currentX }
            });

            currentX += (shape.width || 0) + spacing;
        });

        if (updates.length > 0) {
            updateShapes(updates);
            recordHistory(shapes.map(s => {
                const update = updates.find(u => u.id === s.id);
                return update ? { ...s, ...update.props } : s;
            }), animations);
        }
    };

    const handleDistributeVertical = () => {
        if (selection.length < 3) return; // Need at least 3 objects to distribute

        const selectedShapes = shapes.filter(s => selection.includes(s.id));

        // Sort by y position (top to bottom)
        const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);

        // Calculate total space between topmost and bottommost shapes
        const topmost = sorted[0];
        const bottommost = sorted[sorted.length - 1];

        const topEdge = topmost.y;
        const bottomEdge = bottommost.y + (bottommost.height || 0);
        const totalHeight = bottomEdge - topEdge;

        // Calculate total height of all shapes
        const shapesHeight = sorted.reduce((sum, shape) => sum + (shape.height || 0), 0);

        // Calculate spacing between shapes
        const spacing = (totalHeight - shapesHeight) / (sorted.length - 1);

        // Update positions
        const updates = [];
        let currentY = topEdge;

        sorted.forEach((shape, index) => {
            if (index === 0 || index === sorted.length - 1) {
                // Don't move the first and last shapes
                currentY += (shape.height || 0) + spacing;
                return;
            }

            updates.push({
                id: shape.id,
                props: { y: currentY }
            });

            currentY += (shape.height || 0) + spacing;
        });

        if (updates.length > 0) {
            updateShapes(updates);
            recordHistory(shapes.map(s => {
                const update = updates.find(u => u.id === s.id);
                return update ? { ...s, ...update.props } : s;
            }), animations);
        }
    };

    const addKeyframe = (keyframe) => {
        const existingIndex = keyframes.findIndex(
            kf => kf.shapeId === keyframe.shapeId && Math.abs(kf.time - keyframe.time) < 50
        );

        if (existingIndex >= 0) {
            const newKeyframes = [...keyframes];
            newKeyframes[existingIndex] = { ...newKeyframes[existingIndex], ...keyframe };
            setKeyframes(newKeyframes);
            const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
            recordHistory(shapes, newAnimations);
        } else {
            // Ensure ID
            const newKf = { ...keyframe, id: keyframe.id || Date.now() + Math.random() };
            const newKeyframes = [...keyframes, newKf];
            setKeyframes(newKeyframes);
            const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
            recordHistory(shapes, newAnimations);
        }
    };

    const deleteKeyframe = (keyframe) => {
        const newKeyframes = keyframes.filter(kf => kf.id !== keyframe.id && kf !== keyframe);
        setKeyframes(newKeyframes);
        const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
        recordHistory(shapes, newAnimations);
    };

    const updateKeyframeTime = (id, newTime) => {
        const newKeyframes = keyframes.map(kf => {
            if (kf.id === id) {
                return { ...kf, time: Math.max(0, Math.min(newTime, duration)) };
            }
            return kf;
        });
        setKeyframes(newKeyframes);
    };

    const addAnimation = () => {
        const newAnim = {
            id: Date.now(),
            name: `Animation ${animations.length + 1}`,
            duration: 5000,
            keyframes: [],
            x: 200 + animations.length * 50,
            y: 100 + animations.length * 50
        };
        const newAnimations = [...animations, newAnim];
        setAnimations(newAnimations);
        setActiveAnimationId(newAnim.id);
        recordHistory(shapes, newAnimations);
    };

    const handleNew = () => {
        showConfirm('Create a new project? This will clear your current work.', () => {
            setShapes([]);
            setSelection([]);
            setAnimations([{ id: 1, name: 'Idle', duration: 5000, keyframes: [] }]);
            setActiveAnimationId(1);
            setCurrentTime(0);
            setHistory([]);
            setHistoryIndex(-1);
            recordHistory([], [{ id: 1, name: 'Idle', duration: 5000, keyframes: [] }]);

            // Reset SM
            setSmStates([
                { id: 'entry', name: 'Entry', x: 50, y: 50 },
                { id: 'exit', name: 'Exit', x: 500, y: 50 },
                { id: 'any', name: 'Any State', x: 50, y: 300 },
                { id: 'idle', name: 'Idle', x: 250, y: 150, animationId: 1 },
                { id: 'run', name: 'Run', x: 250, y: 300, animationId: null }
            ]);
            setSmTransitions([
                { id: 1, from: 'entry', to: 'idle', conditions: [] }
            ]);
            setSmInputs([
                { id: 1, name: 'isHovering', type: 'boolean', value: false },
                { id: 2, name: 'speed', type: 'number', value: 0 },
                { id: 3, name: 'jump', type: 'trigger', value: false }
            ]);
            setCurrentStateId('entry');

        }, 'Create New Project');
    };

    const handleFileImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.shapes) setShapes(data.shapes);
                if (data.animations) setAnimations(data.animations);
                if (data.mode) setMode(data.mode);
                setSelection([]);
                setCurrentTime(0);
                recordHistory(data.shapes || [], data.animations || []);
            } catch (error) {
                showAlert('Error loading file: ' + error.message, 'Import Error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportSVG = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(event.target.result, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            if (svgElement) {
                const paths = svgElement.querySelectorAll('path');
                paths.forEach((path, idx) => {
                    const d = path.getAttribute('d');
                    const fill = path.getAttribute('fill') || '#000000';
                    const stroke = path.getAttribute('stroke') || 'none';
                    const strokeWidth = parseFloat(path.getAttribute('stroke-width') || '0');
                    addShape({
                        type: 'path',
                        x: 100 + idx * 20,
                        y: 100 + idx * 20,
                        pathData: d,
                        fill: fill === 'none' ? 'transparent' : fill,
                        stroke: stroke,
                        strokeWidth: strokeWidth,
                        opacity: 1,
                        name: `SVG Path ${shapes.length + idx + 1}`
                    });
                });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                addShape({
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: img.width > 400 ? 400 : img.width,
                    height: img.height > 400 ? (400 / img.width) * img.height : img.height,
                    imageData: event.target.result,
                    opacity: 1,
                    name: `Image ${shapes.length + 1}`
                });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleExport = () => {
        const data = JSON.stringify({ shapes, mode, animations }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rive-clone-export.json';
        a.click();
    };

    const handleOpen = () => {
        fileInputRef.current?.click();
    };

    // State Machine Handlers
    const handleAddState = (newState) => {
        const existing = smStates.find(s => s.id === newState.id);
        if (existing) {
            setSmStates(smStates.map(s => s.id === newState.id ? newState : s));
        } else {
            setSmStates([...smStates, newState]);
        }
    };

    const handleAddTransition = (newTransition) => {
        setSmTransitions([...smTransitions, newTransition]);
    };

    const handleUpdateTransition = (id, updates) => {
        setSmTransitions(smTransitions.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    // Context Value
    const contextValue = {
        shapes, selection, setSelection, tool, addShape, updateShape, updateShapes, recordHistory,
        canvasSize, setCanvasSize, mode, activeView, setActiveView, animations,
        smStates, smTransitions, smInputs, setSmInputs, handleUpdateTransition,
        handleAddState, handleAddTransition, setSelectedNodeId, selectedNodeId,
        setSelectedTransitionId, selectedTransitionId, fireTrigger,
        handleMoveShape, handleReparent, handleAddGroup,
        handleDistributeHorizontal, handleDistributeVertical,
        isTimelineVisible, setIsTimelineVisible, isPlaying, setIsPlaying, currentTime, setCurrentTime,
        duration, setDuration, keyframes, addKeyframe, deleteKeyframe, updateKeyframeTime,
        activeAnimationId, setActiveAnimationId, addAnimation,
        showConfirm, showAlert
    };

    // Component Map for Layout - NOW STABLE
    const componentMap = useMemo(() => ({
        Hierarchy: HierarchyWrapper,
        Properties: PropertiesWrapper,
        Timeline: TimelineWrapper,
        Canvas: CanvasWrapper
    }), []);

    return (
        <AppContext.Provider value={contextValue}>
            <div className="app-container">
                <div className="header">
                    <div className="logo">
                        <Icons.Box />
                        <span>RIVE Clone</span>
                    </div>

                    {/* Toolbar (Design Mode) - Design tools */}
                    {mode === 'design' && (
                        <Toolbar
                            activeTool={tool}
                            setTool={setTool}
                            onImportImage={handleImportImage}
                            onImportSVG={handleImportSVG}
                            onDistributeHorizontal={handleDistributeHorizontal}
                            onDistributeVertical={handleDistributeVertical}
                            selection={selection}
                        />
                    )}

                    <div className="mode-switcher">
                        <div
                            className={`mode-btn ${mode === 'design' ? 'active' : ''}`}
                            onClick={() => {
                                setMode('design');
                                setIsTimelineVisible(false);
                                setIsPlaying(false);
                                setActiveView('canvas');
                            }}
                        >
                            Design
                        </div>
                        <div
                            className={`mode-btn ${mode === 'animate' ? 'active' : ''}`}
                            onClick={() => {
                                setMode('animate');
                                setIsTimelineVisible(true);
                            }}
                        >
                            Animate
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn" onClick={handleExport}>
                            <Icons.Download size={14} />
                            Export
                        </button>
                        <button className="btn primary">
                            <Icons.Play size={14} />
                            Preview
                        </button>
                    </div>
                </div>

                <div className="menu-bar">
                    <MenuBar
                        onNew={handleNew}
                        onOpen={handleOpen}
                        onExport={handleExport}
                        onUndo={undo}
                        onRedo={redo}
                        canvasSize={canvasSize}
                        setCanvasSize={setCanvasSize}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".json" />
                </div>

                <Layout layout={layout} componentMap={componentMap} onLayoutChange={handleLayoutChange} />

                {/* Modal */}
                <Modal {...modalConfig} />
            </div>
        </AppContext.Provider>
    );
};

window.App = App;
