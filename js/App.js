const { useState, useEffect, useRef } = React;

const App = () => {
    const [shapes, setShapes] = useState([
        { id: 1, type: 'rect', x: 100, y: 100, width: 100, height: 100, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Rectangle 1' },
        { id: 2, type: 'ellipse', x: 300, y: 200, width: 100, height: 100, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Circle 1' }
    ]);
    const [selection, setSelection] = useState([]); // Array of IDs
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

    const activeAnimation = animations.find(a => a.id === activeAnimationId) || animations[0];
    const duration = activeAnimation.duration;
    const keyframes = activeAnimation.keyframes;

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

    // State Machine
    const [stateMachineInputs, setStateMachineInputs] = useState([
        { id: 1, name: 'isHovering', type: 'boolean', value: false },
        { id: 2, name: 'speed', type: 'number', value: 1 }
    ]);
    const [stateMachineListeners, setStateMachineListeners] = useState([
        { id: 1, name: 'onClick', type: 'trigger' },
        { id: 2, name: 'onHover', type: 'trigger' }
    ]);
    const [transitions, setTransitions] = useState([
        { id: 1, from: 'Entry', to: 1, condition: 'onClick', animationId: 1 }
    ]);
    const [draggedNode, setDraggedNode] = useState(null);

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

    // Initialize history
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
            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selection.length > 0) {
                    const newShapes = shapes.filter(s => !selection.includes(s.id));
                    setShapes(newShapes);
                    setSelection([]);
                    recordHistory(newShapes, animations);
                }
            }
            // Shortcuts
            if (e.ctrlKey || e.metaKey) {
                // Inverse Selection (Ctrl+I)
                if (e.key === 'i') {
                    e.preventDefault();
                    const allIds = shapes.map(s => s.id);
                    const newSelection = allIds.filter(id => !selection.includes(id));
                    setSelection(newSelection);
                }
                // Undo/Redo
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                }
                // Copy
                if (e.key === 'c') {
                    e.preventDefault();
                    if (selection.length > 0) {
                        const selectedShapes = shapes.filter(s => selection.includes(s.id));
                        setClipboard(selectedShapes);
                    }
                }
                // Paste
                if (e.key === 'v') {
                    e.preventDefault();
                    if (clipboard && Array.isArray(clipboard)) {
                        const newShapes = [...shapes];
                        const newSelection = [];
                        clipboard.forEach(item => {
                            const newShape = {
                                ...item,
                                id: Date.now() + Math.random(), // Ensure unique ID
                                x: item.x + 20,
                                y: item.y + 20,
                                name: item.name + ' Copy'
                            };
                            newShapes.push(newShape);
                            newSelection.push(newShape.id);
                        });
                        setShapes(newShapes);
                        setSelection(newSelection);
                        recordHistory(newShapes, animations);
                    } else if (clipboard) {
                        // Legacy single item support
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
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shapes, selection, clipboard, history, historyIndex, animations]);

    // Animation Loop with interpolation
    useEffect(() => {
        let animationFrame;
        if (isPlaying && mode === 'animate') {
            const start = Date.now() - currentTime;
            const loop = () => {
                const now = Date.now();
                let newTime = (now - start) % duration;
                setCurrentTime(newTime);

                // Interpolate shapes based on keyframes
                shapes.forEach(shape => {
                    const shapeKeyframes = keyframes
                        .filter(kf => kf.shapeId === shape.id)
                        .sort((a, b) => a.time - b.time);

                    if (shapeKeyframes.length >= 2) {
                        // Find surrounding keyframes
                        let prevKf = null;
                        let nextKf = null;

                        for (let i = 0; i < shapeKeyframes.length - 1; i++) {
                            if (shapeKeyframes[i].time <= newTime && shapeKeyframes[i + 1].time >= newTime) {
                                prevKf = shapeKeyframes[i];
                                nextKf = shapeKeyframes[i + 1];
                                break;
                            }
                        }

                        if (prevKf && nextKf) {
                            const progress = (newTime - prevKf.time) / (nextKf.time - prevKf.time);
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
            animationFrame = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, mode, currentTime]);

    const addShape = (shape) => {
        const newShape = { ...shape, id: Date.now() };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        setSelection([newShape.id]);
        setTool('select');
        recordHistory(newShapes, animations);
    };

    const updateShape = (id, newProps) => {
        setShapes(shapes.map(s => s.id === id ? { ...s, ...newProps } : s));
    };

    const updateShapes = (updates) => {
        // updates: array of { id, props }
        const newShapes = shapes.map(s => {
            const update = updates.find(u => u.id === s.id);
            return update ? { ...s, ...update.props } : s;
        });
        setShapes(newShapes);
    };

    const addKeyframe = (keyframe) => {
        // Check if keyframe already exists at this time for this shape
        const existingIndex = keyframes.findIndex(
            kf => kf.shapeId === keyframe.shapeId && Math.abs(kf.time - keyframe.time) < 50
        );

        if (existingIndex >= 0) {
            // Update existing keyframe
            const newKeyframes = [...keyframes];
            newKeyframes[existingIndex] = keyframe;
            setKeyframes(newKeyframes);
            const newAnimations = animations.map(a => a.id === activeAnimationId ? { ...a, keyframes: newKeyframes } : a);
            recordHistory(shapes, newAnimations);
        } else {
            // Add new keyframe
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
        e.target.value = ''; // Reset input
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
                // Get SVG paths and convert to shapes
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
        e.target.value = ''; // Reset input
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

    const handleOpen = () => {
        fileInputRef.current?.click();
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
        e.target.value = ''; // Reset input
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'k' && selection.length > 0 && mode === 'animate') {
                selection.forEach(selId => {
                    const selectedShape = shapes.find(s => s.id === selId);
                    if (selectedShape) {
                        addKeyframe({
                            shapeId: selId,
                            time: currentTime,
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

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selection, currentTime, shapes, mode]);


    useEffect(() => {
        if (draggedNode) {
            const handleMouseMove = (e) => {
                setAnimations(prev => prev.map(anim => {
                    if (anim.id === draggedNode) {
                        return { ...anim, x: (anim.x || 200) + e.movementX, y: (anim.y || 100) + e.movementY };
                    }
                    return anim;
                }));
            };
            const handleMouseUp = () => setDraggedNode(null);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggedNode]);

    const handleNodeMouseDown = (e, animId) => {
        e.stopPropagation();
        setDraggedNode(animId);
    };

    const handleReparent = (childId, parentId) => {
        // Prevent circular dependency
        let current = shapes.find(s => s.id === parentId);
        while (current) {
            if (current.id === childId) return; // Can't parent to self or descendant
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

    return (
        <div className="app-container" style={{
            gridTemplateRows: mode === 'animate' ? 'var(--header-height) 30px 1fr var(--timeline-height)' : 'var(--header-height) 30px 1fr 0px'
        }}>
            <div className="header">
                <div className="logo">
                    <Icons.Layers />
                    <span>Rive Clone</span>
                </div>
                <div className="mode-switcher">
                    <div
                        className={`mode-btn ${mode === 'design' ? 'active' : ''}`}
                        onClick={() => setMode('design')}
                    >
                        Design
                    </div>
                    <div
                        className={`mode-btn ${mode === 'animate' ? 'active' : ''}`}
                        onClick={() => setMode('animate')}
                    >
                        Animate
                    </div>
                </div>
                <div className="actions">
                    <button className="btn primary" onClick={handleExport}>
                        <Icons.Download /> Export
                    </button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileImport}
            />

            <MenuBar
                onNew={handleNew}
                onOpen={handleOpen}
                onExport={handleExport}
                onUndo={undo}
                onRedo={redo}
                canvasSize={canvasSize}
                setCanvasSize={setCanvasSize}
            />

            <Toolbar activeTool={tool} setTool={setTool} onImportImage={handleImportImage} onImportSVG={handleImportSVG} />

            <Hierarchy
                shapes={shapes}
                selection={selection}
                setSelection={setSelection}
                onReparent={handleReparent}
                onAddGroup={handleAddGroup}
            />

            {
                mode === 'animate' ? (
                    <div className="canvas-area" style={{ gridArea: 'canvas', background: '#121212', display: 'flex', gap: '20px', padding: '20px' }}>
                        {/* Left Panel - State Machine */}
                        <div style={{
                            width: '250px',
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {/* Inputs Section */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        Inputs
                                    </h3>
                                    <button
                                        className="btn"
                                        style={{ padding: '2px 6px', fontSize: '11px' }}
                                        onClick={() => {
                                            const newInput = {
                                                id: Date.now(),
                                                name: `input${stateMachineInputs.length + 1}`,
                                                type: 'boolean',
                                                value: false
                                            };
                                            setStateMachineInputs([...stateMachineInputs, newInput]);
                                        }}
                                    >
                                        <Icons.Plus />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {stateMachineInputs.map(input => (
                                        <div key={input.id} style={{
                                            background: 'var(--bg-app)',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '11px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{input.name}</span>
                                                <span style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '10px',
                                                    background: 'var(--bg-panel)',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px'
                                                }}>
                                                    {input.type}
                                                </span>
                                            </div>
                                            {input.type === 'boolean' && (
                                                <div style={{ marginTop: '4px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={input.value}
                                                        onChange={(e) => {
                                                            setStateMachineInputs(stateMachineInputs.map(i =>
                                                                i.id === input.id ? { ...i, value: e.target.checked } : i
                                                            ));
                                                        }}
                                                    />
                                                    <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>
                                                        {input.value ? 'true' : 'false'}
                                                    </span>
                                                </div>
                                            )}
                                            {input.type === 'number' && (
                                                <input
                                                    type="number"
                                                    value={input.value}
                                                    onChange={(e) => {
                                                        setStateMachineInputs(stateMachineInputs.map(i =>
                                                            i.id === input.id ? { ...i, value: Number(e.target.value) } : i
                                                        ));
                                                    }}
                                                    style={{
                                                        marginTop: '4px',
                                                        width: '100%',
                                                        background: 'var(--bg-panel)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--text-primary)',
                                                        padding: '4px',
                                                        borderRadius: '3px',
                                                        fontSize: '11px'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Listeners Section */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        Listeners
                                    </h3>
                                    <button
                                        className="btn"
                                        style={{ padding: '2px 6px', fontSize: '11px' }}
                                        onClick={() => {
                                            const newListener = {
                                                id: Date.now(),
                                                name: `listener${stateMachineListeners.length + 1}`,
                                                type: 'trigger'
                                            };
                                            setStateMachineListeners([...stateMachineListeners, newListener]);
                                        }}
                                    >
                                        <Icons.Plus />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {stateMachineListeners.map(listener => (
                                        <div key={listener.id} style={{
                                            background: 'var(--bg-app)',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{listener.name}</span>
                                            <button
                                                style={{
                                                    background: 'var(--accent)',
                                                    border: 'none',
                                                    color: 'white',
                                                    padding: '3px 8px',
                                                    borderRadius: '3px',
                                                    fontSize: '10px',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    console.log(`Triggered: ${listener.name}`);
                                                    // Here you would trigger the actual state machine transition
                                                }}
                                            >
                                                Fire
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center - State Machine Graph */}
                        <div style={{
                            flex: 1,
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            padding: '20px',
                            position: 'relative',
                            minHeight: '400px'
                        }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px', fontWeight: 600 }}>
                                State Machine
                            </div>

                            {/* Entry Node */}
                            <div style={{
                                position: 'absolute',
                                top: '80px',
                                left: '50px',
                                padding: '12px 24px',
                                background: 'var(--accent)',
                                border: '2px solid var(--accent)',
                                borderRadius: '24px',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                Entry
                            </div>

                            {/* Animation State Nodes */}
                            <svg style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                            }}>
                                {/* Draw connections */}
                                {animations.map((anim, i) => {
                                    const startX = 140;
                                    const startY = 95;

                                    let x1, y1, x2, y2;

                                    if (i === 0) {
                                        x1 = 140; y1 = 95;
                                        x2 = (anim.x || 200); y2 = (anim.y || 70) + 20;
                                    } else {
                                        const prev = animations[i - 1];
                                        x1 = (prev.x || 200 + (i - 1) * 180) + 100;
                                        y1 = (prev.y || 70) + 20;
                                        x2 = (anim.x || 200 + i * 180);
                                        y2 = (anim.y || 70) + 20;
                                    }

                                    return (
                                        <g key={anim.id}>
                                            <line
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke="var(--text-secondary)"
                                                strokeWidth="2"
                                                markerEnd="url(#arrowhead)"
                                            />
                                        </g>
                                    );
                                })}
                                <defs>
                                    <marker
                                        id="arrowhead"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="9"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <polygon points="0 0, 10 3, 0 6" fill="var(--text-secondary)" />
                                    </marker>
                                </defs>
                            </svg>

                            {animations.map((anim, i) => (
                                <div
                                    key={anim.id}
                                    style={{
                                        position: 'absolute',
                                        top: `${anim.y || 70}px`,
                                        left: `${anim.x || 200 + i * 180}px`,
                                        padding: '12px 24px',
                                        background: activeAnimationId === anim.id ? 'var(--selection)' : 'var(--bg-app)',
                                        border: `2px solid ${activeAnimationId === anim.id ? 'var(--accent)' : 'var(--border-color)'}`,
                                        borderRadius: '24px',
                                        color: activeAnimationId === anim.id ? 'var(--accent)' : 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        transition: 'border-color 0.2s, background 0.2s'
                                    }}
                                    onMouseDown={(e) => handleNodeMouseDown(e, anim.id)}
                                    onClick={() => setActiveAnimationId(anim.id)}
                                >
                                    {anim.name}
                                </div>
                            ))}

                            {/* Instructions */}
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                right: '20px',
                                padding: '12px',
                                background: 'var(--bg-app)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                fontSize: '11px',
                                color: 'var(--text-secondary)'
                            }}>
                                <strong style={{ color: 'var(--text-primary)' }}>State Machine:</strong> Use inputs to control animation parameters,
                                and listeners to trigger transitions between states. Drag animation nodes to reposition them.
                            </div>
                        </div>

                        {/* Right Panel - Canvas Preview */}
                        <div style={{
                            width: '400px',
                            background: 'var(--bg-panel)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>
                                Preview
                            </div>
                            <Canvas
                                shapes={shapes}
                                selection={selection}
                                setSelection={setSelection}
                                tool={tool}
                                addShape={addShape}
                                updateShape={updateShape}
                                onUpdateEnd={() => recordHistory(shapes, animations)}
                                canvasSize={{ width: 376, height: 300 }}
                                compact={true}
                                setCanvasSize={setCanvasSize}
                            />
                        </div>
                    </div>
                ) : (
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
                    />
                )
            }

            <Properties
                selection={selection}
                shapes={shapes}
                updateShape={updateShape}
                updateShapes={updateShapes}
                canvasSize={canvasSize}
            />

            {
                mode === 'animate' && (
                    <Timeline
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
                    />
                )
            }
        </div >
    );
};
