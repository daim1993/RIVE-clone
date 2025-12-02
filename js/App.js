const { useState, useEffect, useRef } = React;
const Icons = window.Icons;

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
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);

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

    const handleMoveShape = (draggedId, targetId, position) => {
        // position: 'before', 'after', 'inside'
        if (draggedId === targetId) return;

        const draggedShape = shapes.find(s => s.id === draggedId);
        const targetShape = shapes.find(s => s.id === targetId);
        if (!draggedShape) return;

        let newShapes = [...shapes];

        // Remove dragged shape from array
        newShapes = newShapes.filter(s => s.id !== draggedId);

        // Calculate new parentId
        let newParentId = draggedShape.parentId;

        if (position === 'inside') {
            // Check for circular dependency
            let current = targetShape;
            while (current) {
                if (current.id === draggedId) return;
                current = shapes.find(s => s.id === current.parentId);
            }
            newParentId = targetId;
        } else if (targetShape) {
            // If moving before/after, inherit parent of target
            newParentId = targetShape.parentId;
        }

        // Update dragged shape parent
        const updatedDraggedShape = { ...draggedShape, parentId: newParentId };

        if (position === 'inside') {
            // Add to end of children of target (which means end of array for that parent)
            // But since we want "Front" on "Top", and "Front" is end of array...
            // Wait, if we render in reverse order (Front on Top), then:
            // Top of list = End of Array (Front)
            // Bottom of list = Start of Array (Back)

            // So if we drop "inside", we usually want it to be the top-most child (Front)?
            // Or bottom-most? Standard is usually append to end (Front).
            newShapes.push(updatedDraggedShape);
        } else {
            // Find index of target in the *filtered* array
            const targetIndex = newShapes.findIndex(s => s.id === targetId);
            if (targetIndex !== -1) {
                if (position === 'before') {
                    // "Before" in the LIST (Top) means "After" in the ARRAY (Front)
                    // So we insert AFTER the target index
                    newShapes.splice(targetIndex + 1, 0, updatedDraggedShape);
                } else {
                    // "After" in the LIST (Bottom) means "Before" in the ARRAY (Back)
                    // So we insert BEFORE the target index
                    newShapes.splice(targetIndex, 0, updatedDraggedShape);
                }
            } else {
                newShapes.push(updatedDraggedShape);
            }
        }

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
        <div className="app-container">
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
                        onClick={() => {
                            setMode('animate');
                            setIsTimelineVisible(true);
                        }}
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
                onMoveShape={handleMoveShape}
                onAddGroup={handleAddGroup}
            />

            {
                mode === 'animate' ? (
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
                (mode === 'animate' && isTimelineVisible) && (
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
                        isVisible={isTimelineVisible}
                        onToggle={() => setIsTimelineVisible(!isTimelineVisible)}
                    />
                )
            }
        </div>
    );
};
window.App = App;
