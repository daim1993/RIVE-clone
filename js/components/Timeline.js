const React = window.React;
const Icons = window.Icons;
const InterpolationPanel = window.InterpolationPanel;

const Timeline = ({
    isPlaying, setIsPlaying, currentTime, setCurrentTime,
    duration, setDuration, shapes, selection,
    keyframes, addKeyframe, deleteKeyframe,
    animations, activeAnimationId, setActiveAnimationId, addAnimation,
    isVisible, onToggle,
    smInputs, setSmInputs,
    selectedTransition, onUpdateTransition
}) => {
    const [isDraggingPlayhead, setIsDraggingPlayhead] = React.useState(false);
    const [selectedKeyframe, setSelectedKeyframe] = React.useState(null);
    const timelineRef = React.useRef(null);
    const tracksRef = React.useRef(null);

    // Constants
    const LABEL_WIDTH = 200;
    const RULER_HEIGHT = 24;

    const handlePlayheadMouseDown = (e) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };

    const calculateTimeFromEvent = (e) => {
        if (!tracksRef.current) return 0;
        const rect = tracksRef.current.getBoundingClientRect();
        const trackWidth = rect.width;
        const x = Math.max(0, Math.min(e.clientX - rect.left, trackWidth));
        return (x / trackWidth) * duration;
    };

    const handleScrub = (e) => {
        const newTime = calculateTimeFromEvent(e);
        setCurrentTime(Math.max(0, Math.min(newTime, duration)));
    };

    const handleTimelineMouseDown = (e) => {
        if (e.target.closest('.keyframe') || e.target.closest('.playhead-handle')) return;
        setIsDraggingPlayhead(true);
        setSelectedKeyframe(null);
        handleScrub(e);
    };

    React.useEffect(() => {
        if (isDraggingPlayhead) {
            const handleMouseMove = (e) => handleScrub(e);
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
        if (!selection || selection.length === 0) return;
        selection.forEach(selId => {
            const selectedShape = shapes.find(s => s.id === selId);
            if (!selectedShape) return;
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
        });
    };

    const hasSelection = selection && selection.length > 0;

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const frames = Math.floor((ms % 1000) / (1000 / 60));
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    };

    // State Machine Input Handlers
    const handleAddInput = (type) => {
        if (!setSmInputs) return;
        const newInput = {
            id: Date.now(),
            name: `Input ${smInputs.length + 1}`,
            type: type,
            value: type === 'boolean' ? false : 0
        };
        setSmInputs([...smInputs, newInput]);
    };

    const handleUpdateInput = (id, value) => {
        if (!setSmInputs) return;
        setSmInputs(smInputs.map(i => i.id === id ? { ...i, value } : i));
    };

    return (
        <div className="timeline" style={{ display: 'flex', flexDirection: 'row', height: 'var(--timeline-height)', userSelect: 'none' }}>
            {/* Left Side - Timeline Tracks */}
            <div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
                {/* Header / Toolbar */}
                <div className="timeline-header" style={{ height: '32px', flexShrink: 0 }}>
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
                            <button className="btn" onClick={addAnimation} style={{ padding: '2px', marginLeft: '4px', border: 'none' }} title="New Animation">
                                <Icons.Plus />
                            </button>
                        </div>
                        <button className="btn" onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '4px 8px' }}>
                            {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                        </button>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                width: '60px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {hasSelection && (
                            <button className="btn" onClick={handleAddKeyframe} title="Add Keyframe (K)">
                                <Icons.Plus /> Keyframe
                            </button>
                        )}
                        <button className="btn" onClick={onToggle} title="Collapse Timeline" style={{ padding: '4px 8px' }}>
                            <Icons.ChevronDown />
                        </button>
                    </div>
                </div>

                {/* Ruler Area */}
                <div style={{ height: `${RULER_HEIGHT}px`, borderBottom: '1px solid var(--border-color)', display: 'flex', background: 'var(--bg-panel)' }}>
                    <div style={{ width: `${LABEL_WIDTH}px`, borderRight: '1px solid var(--border-color)', flexShrink: 0 }}></div>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'ew-resize' }} onMouseDown={handleTimelineMouseDown}>
                        {Array.from({ length: 11 }).map((_, i) => (
                            <div key={i} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-color)', paddingLeft: '4px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                                {Math.round((i * 10 / 100) * duration)}ms
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracks Area */}
                <div className="timeline-tracks" style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
                    <div style={{ width: `${LABEL_WIDTH}px`, borderRight: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-panel)', zIndex: 2 }}>
                        {selection && selection.length > 0 && shapes.filter(s => selection.includes(s.id)).map(shape => (
                            <div key={shape.id} className="track" style={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <div className="track-label" style={{ border: 'none', padding: 0 }}>{shape.name || `Shape ${shape.id}`}</div>
                            </div>
                        ))}
                    </div>
                    <div ref={tracksRef} style={{ flex: 1, position: 'relative', minWidth: '0' }} onMouseDown={handleTimelineMouseDown}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none' }}>
                            {Array.from({ length: 11 }).map((_, i) => (
                                <div key={i} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-color)', opacity: 0.3 }} />
                            ))}
                        </div>
                        {selection && selection.length > 0 && shapes.filter(s => selection.includes(s.id)).map(shape => {
                            const shapeKeyframes = keyframes.filter(kf => kf.shapeId === shape.id);
                            return (
                                <div key={shape.id} className="track" style={{ height: '32px', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
                                    {shapeKeyframes.map((kf, idx) => {
                                        const percent = (kf.time / duration) * 100;
                                        const isSelected = selectedKeyframe && selectedKeyframe === kf;
                                        return (
                                            <div
                                                key={idx}
                                                className={`keyframe ${Math.abs(kf.time - currentTime) < 50 ? 'active' : ''}`}
                                                style={{ left: `${percent}%`, border: isSelected ? '2px solid white' : 'none', zIndex: isSelected ? 10 : 1 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentTime(kf.time);
                                                    setSelectedKeyframe(kf);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    if (window.confirm('Delete this keyframe?')) {
                                                        deleteKeyframe(kf);
                                                        if (selectedKeyframe === kf) setSelectedKeyframe(null);
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                        <div className="playhead" style={{ left: `${(currentTime / duration) * 100}%`, position: 'absolute', top: 0, bottom: 0, width: '1px', background: 'var(--accent)', pointerEvents: 'none', zIndex: 10 }} />
                    </div>
                </div>

                {/* Playhead Handle */}
                <div style={{ position: 'absolute', top: '32px', left: `${LABEL_WIDTH}px`, right: 0, height: `${RULER_HEIGHT}px`, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: `${(currentTime / duration) * 100}%`, top: 0, bottom: 0, width: '1px', background: 'var(--accent)', pointerEvents: 'all', cursor: 'ew-resize' }} onMouseDown={handlePlayheadMouseDown}>
                        <div style={{ width: '11px', height: '11px', background: 'var(--accent)', transform: 'translate(-5px, 0) rotate(45deg)', marginTop: '-5px', borderRadius: '2px 2px 2px 0' }} />
                    </div>
                </div>
            </div>

            {/* Right Side - State Machine / Interpolation Panel */}
            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'auto', borderLeft: '1px solid var(--border-color)' }}>
                {selectedKeyframe ? (
                    <InterpolationPanel selectedKeyframe={selectedKeyframe} onUpdateKeyframe={addKeyframe} />
                ) : selectedTransition ? (
                    <div style={{ padding: '12px', color: 'var(--text-primary)' }}>
                        <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            TRANSITION
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '11px' }}>Condition</span>
                                <select
                                    value={selectedTransition.condition || ''}
                                    onChange={(e) => onUpdateTransition(selectedTransition.id, { condition: e.target.value })}
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px', fontSize: '11px', borderRadius: '4px' }}
                                >
                                    <option value="">None (Immediate)</option>
                                    {smInputs && smInputs.map(input => (
                                        <option key={input.id} value={input.name}>{input.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            STATE MACHINE
                        </div>
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Inputs Section */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>Inputs</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn" onClick={() => handleAddInput('boolean')} title="Add Boolean" style={{ padding: '2px' }}><Icons.ToggleLeft size={12} /></button>
                                        <button className="btn" onClick={() => handleAddInput('number')} title="Add Number" style={{ padding: '2px' }}><Icons.Hash size={12} /></button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {smInputs && smInputs.map(input => (
                                        <div key={input.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '4px' }}>
                                            <span style={{ fontSize: '11px' }}>{input.name}</span>
                                            {input.type === 'boolean' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={input.value}
                                                    onChange={(e) => handleUpdateInput(input.id, e.target.checked)}
                                                />
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={input.value}
                                                    onChange={(e) => handleUpdateInput(input.id, Number(e.target.value))}
                                                    style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'right' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {(!smInputs || smInputs.length === 0) && (
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No inputs defined</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
window.Timeline = Timeline;
