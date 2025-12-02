const Icons = window.Icons;

const InterpolationPanel = ({ selectedKeyframe, onUpdateKeyframe }) => {
    if (!selectedKeyframe) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px' }}>
                Select a keyframe to edit interpolation
            </div>
        );
    }

    const interpolation = selectedKeyframe.interpolation || 'linear';
    // Default bezier points (0.42, 0, 0.58, 1) - ease-in-out
    const p1x = selectedKeyframe.p1x ?? 0.42;
    const p1y = selectedKeyframe.p1y ?? 0;
    const p2x = selectedKeyframe.p2x ?? 0.58;
    const p2y = selectedKeyframe.p2y ?? 1;

    const handleChange = (type) => {
        onUpdateKeyframe({ ...selectedKeyframe, interpolation: type });
    };

    const handleCurveChange = (newP1x, newP1y, newP2x, newP2y) => {
        onUpdateKeyframe({
            ...selectedKeyframe,
            p1x: newP1x,
            p1y: newP1y,
            p2x: newP2x,
            p2y: newP2y
        });
    };

    return (
        <div className="interpolation-panel" style={{ padding: '12px', color: 'var(--text-primary)' }}>
            <div style={{ marginBottom: '12px', fontSize: '11px', fontWeight: 600 }}>INTERPOLATION</div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    className={`btn ${interpolation === 'linear' ? 'active' : ''}`}
                    onClick={() => handleChange('linear')}
                    title="Linear"
                    style={{ flex: 1, justifyContent: 'center', background: interpolation === 'linear' ? 'var(--accent)' : 'var(--bg-input)' }}
                >
                    <Icons.Activity size={14} />
                </button>
                <button
                    className={`btn ${interpolation === 'cubic' ? 'active' : ''}`}
                    onClick={() => handleChange('cubic')}
                    title="Cubic"
                    style={{ flex: 1, justifyContent: 'center', background: interpolation === 'cubic' ? 'var(--accent)' : 'var(--bg-input)' }}
                >
                    <Icons.TrendingUp size={14} />
                </button>
                <button
                    className={`btn ${interpolation === 'spring' ? 'active' : ''}`}
                    onClick={() => handleChange('spring')}
                    title="Spring"
                    style={{ flex: 1, justifyContent: 'center', background: interpolation === 'spring' ? 'var(--accent)' : 'var(--bg-input)' }}
                >
                    <Icons.Zap size={14} />
                </button>
            </div>

            {interpolation === 'cubic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Cubic Bezier</div>
                    <BezierEditor
                        p1x={p1x} p1y={p1y} p2x={p2x} p2y={p2y}
                        onChange={handleCurveChange}
                    />
                    <div style={{ display: 'flex', gap: '4px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                        <span>{p1x.toFixed(2)}, {p1y.toFixed(2)}</span>
                        <span>|</span>
                        <span>{p2x.toFixed(2)}, {p2y.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {interpolation === 'spring' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px' }}>Damping</span>
                        <input type="number" defaultValue={10} style={{ width: '40px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)', fontSize: '10px', padding: '2px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px' }}>Stiffness</span>
                        <input type="number" defaultValue={100} style={{ width: '40px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)', fontSize: '10px', padding: '2px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px' }}>Mass</span>
                        <input type="number" defaultValue={1} style={{ width: '40px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-primary)', fontSize: '10px', padding: '2px' }} />
                    </div>
                </div>
            )}
        </div>
    );
};

const BezierEditor = ({ p1x, p1y, p2x, p2y, onChange }) => {
    const size = 100;
    const padding = 20;
    const width = size + padding * 2;
    const height = size + padding * 2;

    const [dragging, setDragging] = React.useState(null);

    const handleMouseDown = (e, point) => {
        e.stopPropagation();
        setDragging(point);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left - padding) / size));
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top - padding) / size));

        if (dragging === 1) {
            onChange(x, y, p2x, p2y);
        } else {
            onChange(p1x, p1y, x, y);
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    React.useEffect(() => {
        if (dragging) {
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [dragging]);

    // Map normalized coordinates to SVG coordinates
    const mapX = (v) => padding + v * size;
    const mapY = (v) => padding + (1 - v) * size;

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{ background: 'var(--bg-input)', borderRadius: '4px', cursor: dragging ? 'grabbing' : 'default' }}
            onMouseMove={handleMouseMove}
        >
            {/* Grid/Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeDasharray="2,2" />

            {/* Curve */}
            <path
                d={`M ${mapX(0)} ${mapY(0)} C ${mapX(p1x)} ${mapY(p1y)}, ${mapX(p2x)} ${mapY(p2y)}, ${mapX(1)} ${mapY(1)}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
            />

            {/* Handles */}
            <line x1={mapX(0)} y1={mapY(0)} x2={mapX(p1x)} y2={mapY(p1y)} stroke="var(--text-secondary)" strokeWidth="1" />
            <line x1={mapX(1)} y1={mapY(1)} x2={mapX(p2x)} y2={mapY(p2y)} stroke="var(--text-secondary)" strokeWidth="1" />

            {/* Control Points */}
            <circle
                cx={mapX(p1x)} cy={mapY(p1y)} r="4"
                fill="var(--accent)"
                stroke="#fff" strokeWidth="1"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, 1)}
            />
            <circle
                cx={mapX(p2x)} cy={mapY(p2y)} r="4"
                fill="var(--accent)"
                stroke="#fff" strokeWidth="1"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, 2)}
            />
        </svg>
    );
};

window.InterpolationPanel = InterpolationPanel;
