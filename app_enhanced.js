const { useState, useEffect, useRef } = React;

// --- Icons ---
const Icons = {
    MousePointer: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="m13 13 6 6" /></svg>,
    Square: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /></svg>,
    Circle: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>,
    Pen: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>,
    Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
    Pause: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
    ChevronRight: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>,
    Layers: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
    Download: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>,
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>,
    Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
};

// --- Components ---

const Toolbar = ({ activeTool, setTool, onImportImage, onImportSVG }) => {
    const fileInputRef = useRef(null);
    const svgInputRef = useRef(null);

    const tools = [
        { id: 'select', icon: Icons.MousePointer },
        { id: 'rect', icon: Icons.Square },
        { id: 'ellipse', icon: Icons.Circle },
        { id: 'pen', icon: Icons.Pen },
    ];

    return (
        <div className="toolbar">
            {tools.map(tool => (
                <div
                    key={tool.id}
                    className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                    onClick={() => setTool(tool.id)}
                    title={tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
                >
                    <tool.icon />
                </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0', width: '100%' }}></div>
            <div
                className="tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Import Image"
            >
                <Icons.Image />
            </div>
            <div
                className="tool-btn"
                onClick={() => svgInputRef.current?.click()}
                title="Import SVG"
            >
                <Icons.Upload />
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onImportImage}
            />
            <input
                ref={svgInputRef}
                type="file"
                accept=".svg"
                style={{ display: 'none' }}
                onChange={onImportSVG}
            />
        </div>
    );
};

const Hierarchy = ({ shapes, selection, setSelection }) => {
    return (
        <div className="panel left-panel">
            <div className="panel-header">Hierarchy</div>
            <div className="panel-content">
                {shapes.map(shape => (
                    <div
                        key={shape.id}
                        className={`tree-item ${selection === shape.id ? 'selected' : ''}`}
                        onClick={() => setSelection(shape.id)}
                    >
                        {shape.type === 'rect' ? <Icons.Square /> :
                            shape.type === 'ellipse' ? <Icons.Circle /> :
                                shape.type === 'image' ? <Icons.Image /> : <Icons.Pen />}
                        <span>{shape.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Properties = ({ selection, shapes, updateShape }) => {
    const selectedShape = shapes.find(s => s.id === selection);

    if (!selectedShape) {
        return (
            <div className="panel right-panel">
                <div className="panel-header">Properties</div>
                <div className="panel-content" style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                    No selection
                </div>
            </div>
        );
    }

    const handleChange = (field, value) => {
        updateShape(selection, { [field]: value });
    };

    return (
        <div className="panel right-panel">
            <div className="panel-header">Properties</div>
            <div className="panel-content">
                <div className="property-group">
                    <span className="property-label">Transform</span>
                    <div className="property-row">
                        <div className="input-group">
                            <label>X</label>
                            <input
                                type="number"
                                value={Math.round(selectedShape.x)}
                                onChange={(e) => handleChange('x', Number(e.target.value))}
                            />
                        </div>
                        <div className="input-group">
                            <label>Y</label>
                            <input
                                type="number"
                                value={Math.round(selectedShape.y)}
                                onChange={(e) => handleChange('y', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    {selectedShape.type !== 'path' && (
                        <>
                            <div className="property-row">
                                <div className="input-group">
                                    <label>W</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.width)}
                                        onChange={(e) => handleChange('width', Number(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>H</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.height)}
                                        onChange={(e) => handleChange('height', Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="property-row">
                        <div className="input-group">
                            <label>R</label>
                            <input
                                type="number"
                                value={selectedShape.rotation || 0}
                                onChange={(e) => handleChange('rotation', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {selectedShape.type !== 'image' && (
                    <div className="property-group">
                        <span className="property-label">Style</span>
                        <div className="property-row">
                            <div className="input-group">
                                <label>Fill</label>
                                <input
                                    type="color"
                                    value={selectedShape.fill || '#ffffff'}
                                    onChange={(e) => handleChange('fill', e.target.value)}
                                    style={{ height: '24px', padding: 0, width: '100%' }}
                                />
                            </div>
                        </div>
                        <div className="property-row">
                            <div className="input-group">
                                <label>Stroke</label>
                                <input
                                    type="color"
                                    value={selectedShape.stroke || '#ffffff'}
                                    onChange={(e) => handleChange('stroke', e.target.value)}
                                    style={{ height: '24px', padding: 0, width: '100%' }}
                                />
                            </div>
                        </div>
                        <div className="property-row">
                            <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <label style={{ marginBottom: '4px', width: 'auto' }}>Stroke Width: {selectedShape.strokeWidth || 0}px</label>
                                <input
                                    type="number"
                                    value={selectedShape.strokeWidth || 0}
                                    onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
                                    min="0"
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-app)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="property-row">
                            <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <label style={{ marginBottom: '4px', width: 'auto' }}>Opacity: {Math.round((selectedShape.opacity || 1) * 100)}%</label>
                                <input
                                    type="range"
                                    value={selectedShape.opacity || 1}
                                    onChange={(e) => handleChange('opacity', Number(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                        <div className="property-row">
                            <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <label style={{ marginBottom: '4px', width: 'auto' }}>Blend Mode</label>
                                <select
                                    value={selectedShape.blendMode || 'normal'}
                                    onChange={(e) => handleChange('blendMode', e.target.value)}
                                    style={{
                                        background: 'var(--bg-app)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="multiply">Multiply</option>
                                    <option value="screen">Screen</option>
                                    <option value="overlay">Overlay</option>
                                    <option value="darken">Darken</option>
                                    <option value="lighten">Lighten</option>
                                    <option value="color-dodge">Color Dodge</option>
                                    <option value="color-burn">Color Burn</option>
                                </select>
                            </div>
                        </div>
                        <div className="property-row">
                            <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <label style={{ marginBottom: '4px', width: 'auto' }}>Mask</label>
                                <select
                                    value={selectedShape.maskId || ''}
                                    onChange={(e) => handleChange('maskId', e.target.value ? Number(e.target.value) : null)}
                                    style={{
                                        background: 'var(--bg-app)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <option value="">None</option>
                                    {shapes.filter(s => s.id !== selection).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Timeline = ({
    isPlaying, setIsPlaying, currentTime, setCurrentTime,
    duration, setDuration, shapes, selection,
    keyframes, addKeyframe, deleteKeyframe,
    animations, activeAnimationId, setActiveAnimationId, addAnimation
}) => {
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const timelineRef = useRef(null);

    const handlePlayheadMouseDown = (e) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };

    const handlePlayheadDrag = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const labelWidth = 200;
        const trackWidth = rect.width - labelWidth;
        const x = Math.max(0, Math.min(e.clientX - rect.left - labelWidth, trackWidth));
        const newTime = (x / trackWidth) * duration;
        setCurrentTime(Math.max(0, Math.min(newTime, duration)));
    };

    const handleTrackClick = (e) => {
        if (e.target.closest('.keyframe') || e.target.closest('.playhead-handle')) return;
        handlePlayheadDrag(e);
    };

    useEffect(() => {
        if (isDraggingPlayhead) {
            const handleMouseMove = (e) => handlePlayheadDrag(e);
            const handleMouseUp = () => setIsDraggingPlayhead(false);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingPlayhead, duration]);

    const handleAddKeyframe = () => {
        if (!selection) return;
        const selectedShape = shapes.find(s => s.id === selection);
        if (!selectedShape) return;

        addKeyframe({
            shapeId: selection,
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
    };

    const selectedShape = shapes.find(s => s.id === selection);

    return (
        <div className="timeline">
            <div className="timeline-header">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '8px', marginRight: '8px' }}>
                        <select
                            value={activeAnimationId}
                            onChange={(e) => setActiveAnimationId(Number(e.target.value))}
                            style={{
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                outline: 'none',
                                cursor: 'pointer',
                                maxWidth: '120px'
                            }}
                        >
                            {animations.map(anim => (
                                <option key={anim.id} value={anim.id}>{anim.name}</option>
                            ))}
                        </select>
                        <button
                            className="btn"
                            onClick={addAnimation}
                            style={{ padding: '2px', marginLeft: '4px', border: 'none' }}
                            title="New Animation"
                        >
                            <Icons.Plus />
                        </button>
                    </div>
                    <button className="btn" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {(currentTime / 1000).toFixed(2)}s / {(duration / 1000).toFixed(1)}s
                    </span>
                    <input
                        type="number"
                        value={duration / 1000}
                        onChange={(e) => setDuration(Math.max(1, Number(e.target.value)) * 1000)}
                        style={{
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            width: '50px'
                        }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>sec</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {selectedShape && (
                        <button
                            className="btn"
                            onClick={handleAddKeyframe}
                            title="Add Keyframe (K)"
                        >
                            <Icons.Plus /> Keyframe
                        </button>
                    )}
                </div>
            </div>
            <div className="timeline-tracks" ref={timelineRef} onClick={handleTrackClick}>
                {shapes.map(shape => {
                    const shapeKeyframes = keyframes.filter(kf => kf.shapeId === shape.id);
                    return (
                        <div key={shape.id} className="track">
                            <div className="track-label">{shape.name}</div>
                            <div className="track-content">
                                {shapeKeyframes.map((kf, idx) => (
                                    <div
                                        key={idx}
                                        className={`keyframe ${Math.abs(kf.time - currentTime) < 50 ? 'active' : ''}`}
                                        style={{ left: `${(kf.time / duration) * 100}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentTime(kf.time);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            deleteKeyframe(kf);
                                        }}
                                        title={`${(kf.time / 1000).toFixed(2)}s - Double click to delete`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Playhead */}
                <div
                    className="playhead"
                    style={{ left: `calc(200px + (100% - 200px) * ${currentTime / duration})` }}
                >
                    <div
                        className="playhead-handle"
                        onMouseDown={handlePlayheadMouseDown}
                        style={{ cursor: 'ew-resize' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// This file is getting too large. I'll continue in the next message with the Canvas component and remaining features.
