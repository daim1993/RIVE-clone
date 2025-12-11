const React = window.React;
const Icons = window.Icons;
const InterpolationPanel = window.InterpolationPanel;
const Select = window.Select;

// --- Sub-components ---

const TimelineHeader = React.memo(({
    activeAnimationId, setActiveAnimationId, animations, addAnimation,
    isPlaying, setIsPlaying, currentTime, duration, setDuration,
    hasSelection, handleAddKeyframe, onToggle
}) => {
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const frames = Math.floor((ms % 1000) / (1000 / 60));
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    };

    return (
        <div className="timeline-header">
            <div className="timeline-controls">
                <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '12px', marginRight: '4px' }}>
                    <Select
                        value={activeAnimationId}
                        onChange={(val) => setActiveAnimationId(Number(val))}
                        options={animations.map(anim => ({ value: anim.id, label: anim.name }))}
                        style={{ minWidth: '140px' }}
                    />
                    <button className="btn" onClick={addAnimation} style={{ padding: '4px', marginLeft: '6px' }} title="New Animation">
                        <Icons.Plus size={14} />
                    </button>
                </div>

                <button className={`btn ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '6px 10px' }} title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
                    {isPlaying ? <Icons.Pause size={14} fill="currentColor" /> : <Icons.Play size={14} fill="currentColor" />}
                </button>

                <div className="timeline-time-display">
                    {formatTime(currentTime)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Duration:</span>
                    <input
                        className="duration-input"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                    <span>ms</span>
                </div>
            </div>

            <div className="timeline-controls">
                {hasSelection && (
                    <button className="btn" onClick={handleAddKeyframe} title="Add Keyframe (K)">
                        <Icons.Diamond size={14} style={{ marginRight: '4px' }} /> Keyframe
                    </button>
                )}
                <button className="btn" onClick={onToggle} title="Collapse Timeline" style={{ padding: '6px' }}>
                    <Icons.ChevronDown size={16} />
                </button>
            </div>
        </div>
    );
});

const TimelineRuler = React.memo(({ duration, handleTimelineMouseDown, LABEL_WIDTH }) => {
    return (
        <div className="timeline-ruler">
            <div style={{ width: `${LABEL_WIDTH}px`, borderRight: '1px solid var(--border-color)', flexShrink: 0, background: 'var(--bg-panel)' }}>
                {/* Maybe labels later */}
            </div>
            <div className="ruler-ticks" onMouseDown={handleTimelineMouseDown}>
                {/* Generate simpler ticks based on percentage for responsiveness */}
                {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="ruler-tick" style={{ left: `${i * 10}%` }}>
                        {Math.round((i * 10 / 100) * duration)}ms
                    </div>
                ))}
            </div>
        </div>
    );
});

const KeyframeNode = React.memo(({ kf, currentTime, duration, isSelected, onClick, deleteKeyframe, onMouseDown, showConfirm }) => {
    const percent = (kf.time / duration) * 100;
    // Highlight if within 50ms
    const isActive = Math.abs(kf.time - currentTime) < 50;

    return (
        <div
            className={`keyframe ${isActive ? 'active' : ''}`}
            style={{ left: `${percent}%`, border: isSelected ? '2px solid white' : 'none', zIndex: isSelected ? 10 : 1, cursor: 'ew-resize' }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(kf);
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); // Prevent timeline scrub
                onMouseDown(e, kf);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (showConfirm) {
                    showConfirm('Delete this keyframe?', () => deleteKeyframe(kf), 'Delete Keyframe');
                } else if (window.confirm('Delete this keyframe?')) {
                    deleteKeyframe(kf);
                }
            }}
        />
    );
});


const TimelineTracks = React.memo(({ selection, shapes, keyframes, currentTime, duration, selectedKeyframe, setCurrentTime, setSelectedKeyframe, deleteKeyframe, LABEL_WIDTH, tracksRef, handleTimelineMouseDown, onKeyframeMouseDown, showConfirm }) => {
    // Determine active tracks
    const activeTracks = React.useMemo(() => {
        if (!selection || selection.length === 0) return [];
        return shapes.filter(s => selection.includes(s.id));
    }, [selection, shapes]);

    return (
        <div className="timeline-tracks-container">
            {/* Sidebar with Labels */}
            <div className="track-sidebar" style={{ width: `${LABEL_WIDTH}px` }}>
                {activeTracks.map(shape => (
                    <div key={shape.id} className="track">
                        <div className="track-label">
                            <Icons.Box size={12} style={{ marginRight: '8px', opacity: 0.7 }} />
                            {shape.name || `Shape ${shape.id}`}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tracks Content */}
            <div className="track-content-area" ref={tracksRef} onMouseDown={handleTimelineMouseDown}>
                {/* Grid Lines */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none' }}>
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${i * 10}%`, top: 0, bottom: 0, borderLeft: '1px solid var(--border-color)', opacity: 0.1 }} />
                    ))}
                </div>

                {activeTracks.map(shape => {
                    const shapeKeyframes = keyframes.filter(kf => kf.shapeId === shape.id);
                    return (
                        <div key={shape.id} className="track">
                            {shapeKeyframes.map((kf, idx) => (
                                <KeyframeNode
                                    key={idx}
                                    kf={kf}
                                    currentTime={currentTime}
                                    duration={duration}
                                    isSelected={selectedKeyframe && selectedKeyframe === kf}
                                    onClick={(k) => {
                                        setCurrentTime(k.time);
                                        setSelectedKeyframe(k);
                                    }}
                                    deleteKeyframe={deleteKeyframe}
                                    onMouseDown={onKeyframeMouseDown}
                                    showConfirm={showConfirm}
                                />
                            ))}
                        </div>
                    );
                })}

                {/* Playhead Line */}
                <div className="playhead" style={{ left: `${(currentTime / duration) * 100}%` }} />
            </div>
        </div>
    );
});

const StateMachinePanel = React.memo(({ selectedKeyframe, selectedTransition, smInputs, handleAddInput, handleUpdateInput, onUpdateTransition, addKeyframe, keyframes, shapes, selection, currentTime, fireTrigger }) => {
    const GraphEditor = window.GraphEditor;
    const [viewMode, setViewMode] = React.useState('auto');

    // Local state for new condition
    const [newConditionInputId, setNewConditionInputId] = React.useState('');
    const [newConditionOperator, setNewConditionOperator] = React.useState('==');
    const [newConditionValue, setNewConditionValue] = React.useState('');

    const effectiveMode = React.useMemo(() => {
        if (viewMode === 'graph') return 'graph';
        if (viewMode === 'statemachine') return 'statemachine';
        if (selectedKeyframe) return 'interpolation';
        return 'statemachine';
    }, [viewMode, selectedKeyframe]);

    const handleAddCondition = () => {
        if (!newConditionInputId) return;
        const input = smInputs.find(i => i.id === Number(newConditionInputId));
        if (!input) return;

        const newCond = {
            inputId: input.id,
            operator: input.type === 'trigger' ? 'fires' : newConditionOperator,
            value: input.type === 'boolean' ? (newConditionValue === 'true' || newConditionValue === true) : newConditionValue
        };

        const currentConditions = selectedTransition.conditions || [];
        onUpdateTransition(selectedTransition.id, {
            conditions: [...currentConditions, newCond]
        });
        setNewConditionInputId('');
        setNewConditionValue('');
    };

    const handleRemoveCondition = (index) => {
        const currentConditions = selectedTransition.conditions || [];
        const newConditions = [...currentConditions];
        newConditions.splice(index, 1);
        onUpdateTransition(selectedTransition.id, { conditions: newConditions });
    };

    return (
        <div className="timeline-right">
            {/* Mode Switcher */}
            <div className="panel-header" style={{ justifyContent: 'space-between', padding: '0 8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button className={`btn ${viewMode === 'auto' ? 'active' : ''}`} onClick={() => setViewMode('auto')} style={{ fontSize: '10px', padding: '4px 8px' }}>Auto</button>
                    <button className={`btn ${viewMode === 'graph' ? 'active' : ''}`} onClick={() => setViewMode('graph')} style={{ fontSize: '10px', padding: '4px 8px' }}><Icons.TrendingUp size={12} style={{ marginRight: '4px' }} /> Graph</button>
                    <button className={`btn ${viewMode === 'statemachine' ? 'active' : ''}`} onClick={() => setViewMode('statemachine')} style={{ fontSize: '10px', padding: '4px 8px' }}><Icons.GitBranch size={12} style={{ marginRight: '4px' }} /> SM</button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                {effectiveMode === 'interpolation' && selectedKeyframe ? (
                    <InterpolationPanel selectedKeyframe={selectedKeyframe} onUpdateKeyframe={addKeyframe} />
                ) : effectiveMode === 'graph' ? (
                    GraphEditor ? <GraphEditor keyframes={keyframes} shapes={shapes} selection={selection} onUpdateKeyframe={addKeyframe} currentTime={currentTime} /> : <div style={{ padding: '16px' }}>Graph Editor not available</div>
                ) : selectedTransition ? (
                    <div className="panel-content">
                        <div className="panel-title">TRANSITION</div>
                        <div>
                            <div style={{ fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>Conditions</div>
                            {(!selectedTransition?.conditions || selectedTransition?.conditions?.length === 0) && (
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>No conditions (Immediate)</div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                {(selectedTransition?.conditions || []).map((cond, idx) => {
                                    const input = smInputs.find(i => i.id === cond.inputId);
                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
                                            <span style={{ flex: 1, fontWeight: 600 }}>{input ? input.name : 'Unknown'}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{cond.operator}</span>
                                            {input && input.type !== 'trigger' && <span style={{ fontWeight: 600 }}>{String(cond.value)}</span>}
                                            <button className="btn" style={{ padding: '2px', marginLeft: 'auto', color: '#f87171' }} onClick={() => handleRemoveCondition(idx)}><Icons.Trash size={12} /></button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Select
                                    value={newConditionInputId}
                                    onChange={(val) => {
                                        setNewConditionInputId(val);
                                        const inp = smInputs.find(i => i.id === Number(val));
                                        if (inp) {
                                            if (inp.type === 'trigger') setNewConditionOperator('fires');
                                            else if (inp.type === 'boolean') { setNewConditionOperator('=='); setNewConditionValue('true'); }
                                            else { setNewConditionOperator('=='); setNewConditionValue('0'); }
                                        }
                                    }}
                                    placeholder="Select Input..."
                                    options={smInputs.map(i => ({ value: i.id, label: `${i.name} (${i.type})` }))}
                                />
                                {newConditionInputId && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn primary" onClick={handleAddCondition} style={{ padding: '4px 8px', width: '100%' }}>Add Condition</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', background: 'transparent' }}>
                            <div className="panel-title">STATE MACHINE INPUTS</div>
                        </div>
                        <div className="panel-content">
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                <button className="btn" onClick={() => handleAddInput('boolean')} title="Add Boolean" style={{ flex: 1 }}><Icons.ToggleLeft size={12} /> Bool</button>
                                <button className="btn" onClick={() => handleAddInput('number')} title="Add Number" style={{ flex: 1 }}><Icons.Hash size={12} /> Num</button>
                                <button className="btn" onClick={() => handleAddInput('trigger')} title="Add Trigger" style={{ flex: 1 }}><Icons.Zap size={12} /> Trig</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {smInputs && smInputs.map(input => (
                                    <div key={input.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                            {input.type === 'trigger' ? <Icons.Zap size={12} color="var(--accent)" /> :
                                                input.type === 'boolean' ? <Icons.ToggleLeft size={12} /> : <Icons.Hash size={12} />}
                                            {input.name}
                                        </span>
                                        {input.type === 'boolean' ? (
                                            <input type="checkbox" checked={input.value} onChange={(e) => handleUpdateInput(input.id, e.target.checked)} />
                                        ) : input.type === 'number' ? (
                                            <input type="number" value={input.value} onChange={(e) => handleUpdateInput(input.id, Number(e.target.value))} style={{ width: '50px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-primary)', textAlign: 'right', padding: '2px 4px' }} />
                                        ) : (
                                            <button className="btn" onClick={() => fireTrigger(input.id)} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--accent)', color: 'white', border: 'none' }}>Fire</button>
                                        )}
                                    </div>
                                ))}
                                {(!smInputs || smInputs.length === 0) && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>No inputs defined. Add one above.</div>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

const Timeline = ({
    isPlaying, setIsPlaying, currentTime, setCurrentTime,
    duration, setDuration, shapes, selection,
    keyframes, addKeyframe, deleteKeyframe, updateKeyframeTime,
    animations, activeAnimationId, setActiveAnimationId, addAnimation,
    isVisible, onToggle,
    smInputs, setSmInputs,
    selectedTransition, onUpdateTransition, showConfirm, fireTrigger
}) => {
    const [isDraggingPlayhead, setIsDraggingPlayhead] = React.useState(false);
    const [draggingKeyframeId, setDraggingKeyframeId] = React.useState(null);
    const [selectedKeyframe, setSelectedKeyframe] = React.useState(null);
    const tracksRef = React.useRef(null);

    // Constants
    const LABEL_WIDTH = 220; // Increased to match CSS


    const handlePlayheadMouseDown = (e) => {
        e.stopPropagation();
        setIsDraggingPlayhead(true);
    };

    const calculateTimeFromEvent = React.useCallback((e) => {
        if (!tracksRef.current) return 0;
        const rect = tracksRef.current.getBoundingClientRect();
        const trackWidth = rect.width;
        const x = Math.max(0, Math.min(e.clientX - rect.left, trackWidth));
        return (x / trackWidth) * duration;
    }, [duration]);

    const handleScrub = React.useCallback((e) => {
        const newTime = calculateTimeFromEvent(e);
        setCurrentTime(Math.max(0, Math.min(newTime, duration)));
    }, [duration, setCurrentTime, calculateTimeFromEvent]);

    const handleKeyframeMouseDown = React.useCallback((e, kf) => {
        // e.stopPropagation() is already called in KeyframeNode
        setDraggingKeyframeId(kf.id);
        setSelectedKeyframe(kf);
    }, []);

    const handleTimelineMouseDown = React.useCallback((e) => {
        if (e.target.closest('.keyframe') || e.target.closest('.playhead-handle')) return;
        setIsDraggingPlayhead(true);
        setSelectedKeyframe(null);
        handleScrub(e);
    }, [handleScrub]);

    // Cleanup drag state on mouse up
    const handleDragEnd = React.useCallback(() => {
        setIsDraggingPlayhead(false);
        setDraggingKeyframeId(null);
    }, []);

    React.useEffect(() => {
        if (isDraggingPlayhead) {
            const handleMouseMove = (e) => handleScrub(e);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
        if (draggingKeyframeId) {
            const handleMouseMove = (e) => {
                const newTime = calculateTimeFromEvent(e);
                if (updateKeyframeTime) {
                    updateKeyframeTime(draggingKeyframeId, newTime);
                    // Also update current time to match while dragging? 
                    // Users typically like to see the frame they are dragging to
                    setCurrentTime(newTime);
                }
            };
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDraggingPlayhead, draggingKeyframeId, handleScrub, handleDragEnd, calculateTimeFromEvent, updateKeyframeTime, setCurrentTime]);

    const handleAddKeyframeWithSelection = React.useCallback(() => {
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
    }, [selection, shapes, currentTime, addKeyframe]);

    // ... State Machine Input Handlers wrappers ...
    const handleAddInput = React.useCallback((type) => {
        if (!setSmInputs) return;
        const newInput = {
            id: Date.now(),
            name: `Input ${smInputs.length + 1}`,
            type: type,
            value: type === 'boolean' ? false : 0
        };
        setSmInputs([...smInputs, newInput]);
    }, [smInputs, setSmInputs]);

    const handleUpdateInput = React.useCallback((id, value) => {
        if (!setSmInputs) return;
        setSmInputs(smInputs.map(i => i.id === id ? { ...i, value } : i));
    }, [smInputs, setSmInputs]);

    const hasSelection = selection && selection.length > 0;

    return (
        <div className="timeline">
            {/* Left Side - Timeline Tracks */}
            <div className="timeline-left">
                <TimelineHeader
                    activeAnimationId={activeAnimationId}
                    setActiveAnimationId={setActiveAnimationId}
                    animations={animations}
                    addAnimation={addAnimation}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    setDuration={setDuration}
                    hasSelection={hasSelection}
                    handleAddKeyframe={handleAddKeyframeWithSelection}
                    onToggle={onToggle}
                />

                <TimelineRuler
                    duration={duration}
                    handleTimelineMouseDown={handleTimelineMouseDown}
                    LABEL_WIDTH={LABEL_WIDTH}
                />

                <TimelineTracks
                    selection={selection}
                    shapes={shapes}
                    keyframes={keyframes}
                    currentTime={currentTime}
                    duration={duration}
                    selectedKeyframe={selectedKeyframe}
                    setCurrentTime={setCurrentTime}
                    setSelectedKeyframe={setSelectedKeyframe}
                    deleteKeyframe={deleteKeyframe}
                    LABEL_WIDTH={LABEL_WIDTH}
                    tracksRef={tracksRef}
                    handleTimelineMouseDown={handleTimelineMouseDown}
                    onKeyframeMouseDown={handleKeyframeMouseDown}
                    showConfirm={showConfirm}
                />

                {/* Playhead Handle Overlay - Positioned securely over the tracks/ruler */}
                <div className="playhead-handle-container">
                    <div
                        className="playhead-handle"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                        onMouseDown={handlePlayheadMouseDown}
                    />
                </div>
            </div>

            <StateMachinePanel
                selectedKeyframe={selectedKeyframe}
                selectedTransition={selectedTransition}
                smInputs={smInputs}
                handleAddInput={handleAddInput}
                handleUpdateInput={handleUpdateInput}
                onUpdateTransition={onUpdateTransition}
                addKeyframe={addKeyframe}
                keyframes={keyframes}
                shapes={shapes}
                selection={selection}
                currentTime={currentTime}
                fireTrigger={fireTrigger}
            />
        </div>
    );
};
window.Timeline = Timeline;
