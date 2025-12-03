// Wait for all components to be available before initializing App
(function initializeApp() {
    // Check if all required components are loaded
    const checkComponents = () => {
        return window.Icons &&
            window.StateMachineEditor &&
            window.Hierarchy &&
            window.Properties &&
            window.Canvas &&
            window.Timeline &&
            window.MenuBar &&
            window.Toolbar;
    };

    if (checkComponents()) {
        console.log('All components loaded, initializing App');
        startApp();
    } else {
        console.log('Waiting for components to load...');
        setTimeout(initializeApp, 50);
    }
})();

function startApp() {
    const { useState, useEffect, useRef } = React;
    const Icons = window.Icons;
    const StateMachineEditor = window.StateMachineEditor;
    const Hierarchy = window.Hierarchy;
    const Properties = window.Properties;
    const Canvas = window.Canvas;
    const Timeline = window.Timeline;
    const MenuBar = window.MenuBar;
    const Toolbar = window.Toolbar;

    // Debug: Log which components are loaded
    console.log('Component loading check:', {
        Icons: !!Icons,
        StateMachineEditor: !!StateMachineEditor,
        Hierarchy: !!Hierarchy,
        Properties: !!Properties,
        Canvas: !!Canvas,
        Timeline: !!Timeline,
        MenuBar: !!MenuBar,
        Toolbar: !!Toolbar
    });


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

    const App = () => {
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
            { id: 'idle', name: 'Idle', x: 250, y: 150, animationId: 1 },
            { id: 'run', name: 'Run', x: 250, y: 300, animationId: null }
        ]);
        const [smTransitions, setSmTransitions] = useState([
            { id: 1, from: 'entry', to: 'idle', condition: null }
        ]);
        const [smInputs, setSmInputs] = useState([
            { id: 1, name: 'isHovering', type: 'boolean', value: false },
            { id: 2, name: 'speed', type: 'number', value: 0 }
        ]);
        const [currentStateId, setCurrentStateId] = useState('entry');
        const [selectedTransitionId, setSelectedTransitionId] = useState(null);
        const [selectedNodeId, setSelectedNodeId] = useState(null);

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

        // Animation Loop
        useEffect(() => {
            let animationFrame;
            let start = Date.now() - currentTime;

            const loop = () => {
                if (!isPlaying) return;

                // State Machine Logic
                // 1. Check Transitions
                const possibleTransitions = smTransitions.filter(t => t.from === currentStateId);
                for (const t of possibleTransitions) {
                    if (!t.condition) {
                        // Immediate transition (e.g. from Entry)
                        setCurrentStateId(t.to);
                        start = Date.now(); // Reset time for new state
                        break;
                    }

                    const input = smInputs.find(i => i.name === t.condition);
                    if (input && input.value === true) {
                        setCurrentStateId(t.to);
                        start = Date.now();
                        break;
                    }
                }

                // 2. Get Active Animation from Current State
                const currentState = smStates.find(s => s.id === currentStateId);
                const currentAnimId = currentState?.animationId;
                const currentAnim = animations.find(a => a.id === currentAnimId);

                if (!currentAnim) {
                    // No animation for this state, just keep loop running
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

                // Interpolate shapes based on keyframes of CURRENT animation
                const currentKeyframes = currentAnim.keyframes || [];

                shapes.forEach(shape => {
                    const shapeKeyframes = currentKeyframes
                        .filter(kf => kf.shapeId === shape.id)
                        .sort((a, b) => a.time - b.time);

                    if (shapeKeyframes.length >= 2) {
                        let prevKf = null;
                        let nextKf = null;

                        for (let i = 0; i < shapeKeyframes.length - 1; i++) {
                            if (newTime >= shapeKeyframes[i].time && newTime < shapeKeyframes[i + 1].time) {
                                prevKf = shapeKeyframes[i];
                                nextKf = shapeKeyframes[i + 1];
                                break;
                            }
                        }

                        if (prevKf && nextKf) {
                            let progress = (newTime - prevKf.time) / (nextKf.time - prevKf.time);
                            const type = prevKf.interpolation || 'linear';
                            if (Easing[type]) {
                                progress = Easing[type](progress);
                            }

                            const interpolated = {};
                            Object.keys(prevKf.properties).forEach(key => {
                                interpolated[key] = prevKf.properties[key] +
                                    (nextKf.properties[key] - prevKf.properties[key]) * progress;
                            });

                            updateShape(shape.id, interpolated);
                        }
                    }
                });

                animationFrame = requestAnimationFrame(loop);
            };

            if (isPlaying) {
                start = Date.now() - currentTime;
                loop();
            } else {
                cancelAnimationFrame(animationFrame);
            }

            return () => cancelAnimationFrame(animationFrame);
        }, [isPlaying, keyframes, duration, shapes, smStates, smTransitions, smInputs, currentStateId]);

        const addShape = (shape) => {
            const newShape = { ...shape, id: Date.now() };
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            setSelection([newShape.id]);
            setTool('select');
            recordHistory(newShapes, animations);
        };

        const updateShape = (id, newProps) => {
            setShapes(prevShapes => prevShapes.map(s => s.id === id ? { ...s, ...newProps } : s));
        };

        const updateShapes = (updates) => {
            const newShapes = shapes.map(s => {
                const update = updates.find(u => u.id === s.id);
                return update ? { ...s, ...update.props } : s;
            });
            setShapes(newShapes);
        };

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
                name: `Group ${shapes.length + 1}`,
                x: canvasSize.width / 2,
                y: canvasSize.height / 2,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
                visible: true
            };
            addShape(newGroup);
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
                const newKeyframes = [...keyframes, keyframe];
                setKeyframes(newKeyframes);
                const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
                recordHistory(shapes, newAnimations);
            }
        };

        const deleteKeyframe = (keyframe) => {
            const newKeyframes = keyframes.filter(kf => kf !== keyframe);
            setKeyframes(newKeyframes);
            const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
            recordHistory(shapes, newAnimations);
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
            if (confirm('Create a new project? This will clear your current work.')) {
                setShapes([]);
                setSelection([]);
                setAnimations([{ id: 1, name: 'Idle', duration: 5000, keyframes: [] }]);
                setActiveAnimationId(1);
                setCurrentTime(0);
                setHistory([]);
                setHistoryIndex(-1);
                recordHistory([], [{ id: 1, name: 'Idle', duration: 5000, keyframes: [] }]);
            }
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
                    alert('Error loading file: ' + error.message);
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

        return (
            <div className="app-container">
                <div className="header">
                    <div className="logo">
                        <Icons.Box />
                        <span>RIVE Clone</span>
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
                    <div className="mode-switch">
                        <button
                            className={mode === 'design' ? 'active' : ''}
                            onClick={() => {
                                setMode('design');
                                setIsTimelineVisible(false);
                                setIsPlaying(false);
                                setActiveView('canvas');
                            }}
                        >
                            Design
                        </button>
                        <button
                            className={`mode-btn ${mode === 'animate' ? 'active' : ''}`}
                            onClick={() => {
                                setMode('animate');
                                setIsTimelineVisible(true);
                            }}
                        >
                            Animate
                        </button>
                    </div>
                </div>

                <div className="main-content">
                    {/* Left Sidebar - Hierarchy */}
                    <div className="sidebar-left">
                        <Hierarchy
                            shapes={shapes}
                            selection={selection}
                            setSelection={setSelection}
                            onMoveShape={handleMoveShape}
                            onReparent={handleReparent}
                            onAddGroup={handleAddGroup}
                        />
                    </div>

                    {/* Center Area */}
                    <div className="canvas-area" style={{ display: 'flex', flexDirection: 'column' }}>
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

                        {/* Floating Toolbar (Design Mode) */}
                        {mode === 'design' && (
                            <Toolbar
                                activeTool={tool}
                                setTool={setTool}
                                onImportImage={handleImportImage}
                                onImportSVG={handleImportSVG}
                            />
                        )}
                    </div>

                    {/* Right Sidebar - Properties */}
                    <div className="sidebar-right">
                        <Properties
                            selection={selection}
                            shapes={shapes}
                            updateShapes={updateShapes}
                        />
                    </div>
                </div>

                {/* Timeline Overlay */}
                {mode === 'animate' && isTimelineVisible && (
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
                        // State Machine Props
                        smInputs={smInputs}
                        setSmInputs={setSmInputs}
                        selectedTransition={smTransitions.find(t => t.id === selectedTransitionId)}
                        onUpdateTransition={handleUpdateTransition}
                    />
                )}
            </div>
        );
    };

    window.App = App;
}  // End of startApp function
