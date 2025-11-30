const Timeline = ({
    isPlaying, setIsPlaying, currentTime, setCurrentTime,
    duration, setDuration, shapes, selection,
    keyframes, addKeyframe, deleteKeyframe,
    animations, activeAnimationId, setActiveAnimationId, addAnimation
}) => {
    const [isDraggingPlayhead, setIsDraggingPlayhead] = React.useState(false);
    const timelineRef = React.useRef(null);

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

    React.useEffect(() => {
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
                {/* Frame guides - every 5 frames at 30fps */}
                <div style={{ position: 'absolute', top: 0, left: '200px', right: 0, height: '100%', pointerEvents: 'none' }}>
                    {Array.from({ length: Math.floor((duration / 1000) * 30 / 5) + 1 }).map((_, i) => {
                        const frameTime = (i * 5 / 30) * 1000; // 5 frames at 30fps
                        const percent = (frameTime / duration) * 100;
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${percent}%`,
                                    top: 0,
                                    bottom: 0,
                                    width: '1px',
                                    background: i % 6 === 0 ? 'rgba(161, 161, 170, 0.3)' : 'rgba(161, 161, 170, 0.1)',
                                    pointerEvents: 'none'
                                }}
                            >
                                {i % 6 === 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-18px',
                                        left: '2px',
                                        fontSize: '9px',
                                        color: 'var(--text-secondary)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {i * 5}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
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
