const React = window.React;
const Icons = window.Icons;

/**
 * GraphEditor - Bezier curve editor for keyframe interpolation
 * Inspired by After Effects' Graph Editor
 */
const GraphEditor = ({ keyframes, shapes, selection, onUpdateKeyframe, currentTime }) => {
    const [selectedProperty, setSelectedProperty] = React.useState('y'); // x, y, rotation, scale, opacity
    const [viewMode, setViewMode] = React.useState('value'); // 'value' or 'speed'
    const canvasRef = React.useRef(null);
    const [hoveredKeyframe, setHoveredKeyframe] = React.useState(null);
    const [draggedKeyframe, setDraggedKeyframe] = React.useState(null);

    const PADDING = 40;
    const HANDLE_RADIUS = 6;

    // Filter keyframes for selected shapes and property
    const relevantKeyframes = React.useMemo(() => {
        if (!selection || selection.length === 0) return [];

        return keyframes
            .filter(kf => selection.includes(kf.shapeId))
            .filter(kf => kf.properties && kf.properties[selectedProperty] !== undefined)
            .sort((a, b) => a.time - b.time)
            .map(kf => ({
                ...kf,
                value: kf.properties[selectedProperty]
            }));
    }, [keyframes, selection, selectedProperty]);

    // Calculate value range for scaling
    const valueRange = React.useMemo(() => {
        if (relevantKeyframes.length === 0) return { min: 0, max: 1 };

        const values = relevantKeyframes.map(kf => kf.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1 || 1;

        return { min: min - padding, max: max + padding };
    }, [relevantKeyframes]);

    const drawGraph = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#1a1e2e';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
        ctx.lineWidth = 1;

        // Vertical grid lines (time)
        for (let x = PADDING; x < width - PADDING; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, height - PADDING);
            ctx.stroke();
        }

        // Horizontal grid lines (value)
        for (let y = PADDING; y < height - PADDING; y += 30) {
            ctx.beginPath();
            ctx.moveTo(PADDING, y);
            ctx.lineTo(width - PADDING, y);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = 'rgba(150, 150, 200, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING);
        ctx.lineTo(PADDING, height - PADDING);
        ctx.lineTo(width - PADDING, height - PADDING);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#8892b0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(valueRange.max.toFixed(1), PADDING - 5, PADDING + 10);
        ctx.fillText(valueRange.min.toFixed(1), PADDING - 5, height - PADDING);
        ctx.textAlign = 'center';
        ctx.fillText('Time', width / 2, height - 10);

        if (relevantKeyframes.length === 0) return;

        // Helper: Convert time to X coordinate
        const timeToX = (time) => {
            const duration = relevantKeyframes[relevantKeyframes.length - 1].time - relevantKeyframes[0].time || 1;
            const normalizedTime = (time - relevantKeyframes[0].time) / duration;
            return PADDING + normalizedTime * (width - 2 * PADDING);
        };

        // Helper: Convert value to Y coordinate
        const valueToY = (value) => {
            const range = valueRange.max - valueRange.min;
            const normalizedValue = (value - valueRange.min) / range;
            return height - PADDING - normalizedValue * (height - 2 * PADDING);
        };

        // Draw curve
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 2;
        ctx.beginPath();

        relevantKeyframes.forEach((kf, i) => {
            const x = timeToX(kf.time);
            const y = valueToY(kf.value);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevKf = relevantKeyframes[i - 1];
                const prevX = timeToX(prevKf.time);
                const prevY = valueToY(prevKf.value);

                if (kf.interpolation === 'linear' || !kf.interpolation) {
                    ctx.lineTo(x, y);
                } else if (kf.interpolation === 'easeIn' || kf.interpolation === 'easeOut' || kf.interpolation === 'easeInOut') {
                    // Draw bezier curve
                    const cp1x = prevX + (x - prevX) * 0.33;
                    const cp1y = prevY;
                    const cp2x = prevX + (x - prevX) * 0.67;
                    const cp2y = y;
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });
        ctx.stroke();

        // Draw keyframes
        relevantKeyframes.forEach((kf, i) => {
            const x = timeToX(kf.time);
            const y = valueToY(kf.value);

            // Keyframe marker
            ctx.fillStyle = hoveredKeyframe === kf ? '#f72585' : '#7209b7';
            ctx.beginPath();
            ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Time label
            if (hoveredKeyframe === kf) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`${kf.time}ms: ${kf.value.toFixed(1)}`, x, y - 15);
            }
        });

        // Draw current time indicator
        if (currentTime >= relevantKeyframes[0].time && currentTime <= relevantKeyframes[relevantKeyframes.length - 1].time) {
            const x = timeToX(currentTime);
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, height - PADDING);
            ctx.stroke();
            ctx.setLineDash([]);
        }

    }, [relevantKeyframes, valueRange, hoveredKeyframe, currentTime]);

    React.useEffect(() => {
        drawGraph();
    }, [drawGraph]);

    const handleCanvasMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if hovering over a keyframe
        let foundHover = null;
        relevantKeyframes.forEach(kf => {
            const duration = relevantKeyframes[relevantKeyframes.length - 1].time - relevantKeyframes[0].time || 1;
            const normalizedTime = (kf.time - relevantKeyframes[0].time) / duration;
            const kfX = PADDING + normalizedTime * (canvas.width - 2 * PADDING);

            const range = valueRange.max - valueRange.min;
            const normalizedValue = (kf.value - valueRange.min) / range;
            const kfY = canvas.height - PADDING - normalizedValue * (canvas.height - 2 * PADDING);

            const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);
            if (distance < HANDLE_RADIUS + 5) {
                foundHover = kf;
            }
        });

        setHoveredKeyframe(foundHover);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
            {/* Header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>GRAPH EDITOR</span>
                    <select
                        value={selectedProperty}
                        onChange={(e) => setSelectedProperty(e.target.value)}
                        style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="x">Position X</option>
                        <option value="y">Position Y</option>
                        <option value="rotation">Rotation</option>
                        <option value="opacity">Opacity</option>
                        <option value="width">Width</option>
                        <option value="height">Height</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={`btn ${viewMode === 'value' ? 'active' : ''}`}
                        onClick={() => setViewMode('value')}
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                    >
                        Value
                    </button>
                    <button
                        className={`btn ${viewMode === 'speed' ? 'active' : ''}`}
                        onClick={() => setViewMode('speed')}
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                        disabled
                    >
                        Speed
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    onMouseMove={handleCanvasMouseMove}
                    style={{ width: '100%', height: '100%', cursor: hoveredKeyframe ? 'pointer' : 'default' }}
                />
            </div>

            {/* Info */}
            {relevantKeyframes.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    textAlign: 'center'
                }}>
                    <Icons.TrendingUp size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <div>Select a shape and add keyframes to edit the curve</div>
                </div>
            )}
        </div>
    );
};

window.GraphEditor = GraphEditor;
