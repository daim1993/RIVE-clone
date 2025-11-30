const Canvas = ({ shapes, selection, setSelection, tool, addShape, updateShape, onUpdateEnd, canvasSize, compact = false }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isResizing, setIsResizing] = React.useState(false);
    const [isRotating, setIsRotating] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = React.useState(null);
    const [pathPoints, setPathPoints] = React.useState([]);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [activePointIndex, setActivePointIndex] = React.useState(-1);
    const [smartGuides, setSmartGuides] = React.useState([]);
    const [isEditingPath, setIsEditingPath] = React.useState(false);
    const [editingPathPoints, setEditingPathPoints] = React.useState([]);
    const canvasRef = React.useRef(null);

    const getCanvasCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const finishPath = (closed = false) => {
        if (pathPoints.length < 2) return;

        const points = [...pathPoints];
        const pathData = points.map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = points[i - 1];
            return `C ${prev.x + prev.hx} ${prev.y + prev.hy} ${p.x - p.hx} ${p.y - p.hy} ${p.x} ${p.y}`;
        }).join(' ');

        const finalPathData = closed ? pathData + ' Z' : pathData;

        const bounds = points.reduce((acc, p) => ({
            minX: Math.min(acc.minX, p.x),
            minY: Math.min(acc.minY, p.y),
            maxX: Math.max(acc.maxX, p.x),
            maxY: Math.max(acc.maxY, p.y)
        }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

        addShape({
            type: 'path',
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
            pathData: finalPathData,
            pathPoints: points,
            fill: closed ? '#6366f1' : 'none',
            stroke: '#10b981',
            strokeWidth: 3,
            opacity: 1,
            name: `Path ${shapes.length + 1}`
        });

        setPathPoints([]);
        setIsDrawing(false);
        if (onUpdateEnd) onUpdateEnd();
    };

    const handleCanvasMouseDown = (e) => {
        if (e.target.closest('.transform-handle') || e.target.closest('.shape-element')) return;

        const coords = getCanvasCoords(e);

        if (tool === 'rect') {
            addShape({
                type: 'rect',
                x: coords.x - 50,
                y: coords.y - 50,
                width: 100,
                height: 100,
                fill: '#6366f1',
                stroke: '#ffffff',
                strokeWidth: 2,
                opacity: 1,
                blendMode: 'normal',
                name: `Rectangle ${shapes.length + 1}`
            });
        } else if (tool === 'ellipse') {
            addShape({
                type: 'ellipse',
                x: coords.x - 50,
                y: coords.y - 50,
                width: 100,
                height: 100,
                fill: '#ec4899',
                stroke: '#ffffff',
                strokeWidth: 2,
                opacity: 1,
                blendMode: 'normal',
                name: `Circle ${shapes.length + 1}`
            });
        } else if (tool === 'pen') {
            if (!isDrawing) {
                setIsDrawing(true);
                setPathPoints([{ ...coords, hx: 0, hy: 0 }]);
                setActivePointIndex(0);
            } else {
                const firstPoint = pathPoints[0];
                if (firstPoint && Math.abs(coords.x - firstPoint.x) < 10 && Math.abs(coords.y - firstPoint.y) < 10) {
                    finishPath(true);
                    return;
                }
                setPathPoints([...pathPoints, { ...coords, hx: 0, hy: 0 }]);
                setActivePointIndex(pathPoints.length);
            }
            setIsDragging(true);
            setDragStart(coords);
        } else if (tool === 'select') {
            setSelection(null);
        }
    };

    const handleCanvasDoubleClick = (e) => {
        if (tool === 'pen' && isDrawing && pathPoints.length > 1) {
            finishPath(false);
        }
    };

    const handleShapeMouseDown = (e, shapeId) => {
        e.stopPropagation();
        setSelection(shapeId);
        setIsDragging(true);
        const coords = getCanvasCoords(e);
        setDragStart(coords);
    };

    const handleShapeDoubleClick = (e, shapeId) => {
        e.stopPropagation();
        const shape = shapes.find(s => s.id === shapeId);

        // Double-click on path to edit
        if (shape && shape.type === 'path' && shape.pathPoints) {
            setIsEditingPath(true);
            setEditingPathPoints(shape.pathPoints);
            setSelection(shapeId);
        }
    };

    const handleResizeMouseDown = (e, handle) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
        const coords = getCanvasCoords(e);
        setDragStart(coords);
    };

    const handleRotateMouseDown = (e) => {
        e.stopPropagation();
        setIsRotating(true);
        const coords = getCanvasCoords(e);
        setDragStart(coords);
    };

    const handleMouseMove = (e) => {
        const coords = getCanvasCoords(e);
        const dx = coords.x - dragStart.x;
        const dy = coords.y - dragStart.y;

        if (tool === 'pen' && isDrawing && isDragging) {
            const newPoints = [...pathPoints];
            const point = newPoints[activePointIndex];
            if (point) {
                point.hx = coords.x - point.x;
                point.hy = coords.y - point.y;
                setPathPoints(newPoints);
            }
            return;
        }

        if (!selection) return;

        const selectedShape = shapes.find(s => s.id === selection);
        if (!selectedShape) return;

        if (isDragging) {
            const newX = selectedShape.x + dx;
            const newY = selectedShape.y + dy;

            // Calculate smart guides
            const guides = [];
            const snapThreshold = 5;
            const centerX = newX + (selectedShape.width || 0) / 2;
            const centerY = newY + (selectedShape.height || 0) / 2;
            const rightX = newX + (selectedShape.width || 0);
            const bottomY = newY + (selectedShape.height || 0);

            shapes.forEach(shape => {
                if (shape.id === selection) return;

                const sCenterX = shape.x + (shape.width || 0) / 2;
                const sCenterY = shape.y + (shape.height || 0) / 2;
                const sRightX = shape.x + (shape.width || 0);
                const sBottomY = shape.y + (shape.height || 0);

                // Vertical guides
                if (Math.abs(newX - shape.x) < snapThreshold) {
                    guides.push({ type: 'vertical', pos: shape.x });
                }
                if (Math.abs(centerX - sCenterX) < snapThreshold) {
                    guides.push({ type: 'vertical', pos: sCenterX });
                }
                if (Math.abs(rightX - sRightX) < snapThreshold) {
                    guides.push({ type: 'vertical', pos: sRightX });
                }

                // Horizontal guides
                if (Math.abs(newY - shape.y) < snapThreshold) {
                    guides.push({ type: 'horizontal', pos: shape.y });
                }
                if (Math.abs(centerY - sCenterY) < snapThreshold) {
                    guides.push({ type: 'horizontal', pos: sCenterY });
                }
                if (Math.abs(bottomY - sBottomY) < snapThreshold) {
                    guides.push({ type: 'horizontal', pos: sBottomY });
                }
            });

            setSmartGuides(guides);

            updateShape(selection, {
                x: newX,
                y: newY
            });
            setDragStart(coords);
        } else if (isResizing && resizeHandle) {
            const newProps = { ...selectedShape };

            switch (resizeHandle) {
                case 'nw':
                    newProps.x += dx;
                    newProps.y += dy;
                    newProps.width -= dx;
                    newProps.height -= dy;
                    break;
                case 'ne':
                    newProps.y += dy;
                    newProps.width += dx;
                    newProps.height -= dy;
                    break;
                case 'sw':
                    newProps.x += dx;
                    newProps.width -= dx;
                    newProps.height += dy;
                    break;
                case 'se':
                    newProps.width += dx;
                    newProps.height += dy;
                    break;
            }

            if (newProps.width > 10 && newProps.height > 10) {
                updateShape(selection, newProps);
                setDragStart(coords);
            }
        } else if (isRotating) {
            const centerX = selectedShape.x + (selectedShape.width || 0) / 2;
            const centerY = selectedShape.y + (selectedShape.height || 0) / 2;

            const angle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
            updateShape(selection, { rotation: Math.round(angle) });
        }
    };

    const handleMouseUp = () => {
        if (tool === 'pen' && isDragging) {
            setIsDragging(false);
            return;
        }
        if (isDragging || isResizing || isRotating) {
            if (onUpdateEnd) onUpdateEnd();
        }
        setIsDragging(false);
        setIsResizing(false);
        setIsRotating(false);
        setResizeHandle(null);
        setSmartGuides([]);
    };

    React.useEffect(() => {
        if (isDragging || isResizing || isRotating) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, isRotating, dragStart, selection]);

    const selectedShape = shapes.find(s => s.id === selection);

    return (
        <div className="canvas-area" onMouseDown={handleCanvasMouseDown} onDoubleClick={handleCanvasDoubleClick}>
            <div className="artboard" style={{ width: canvasSize.width, height: canvasSize.height }} ref={canvasRef}>
                <svg width="100%" height="100%">
                    <defs>
                        {shapes.map(shape => (
                            <clipPath key={`mask-${shape.id}`} id={`mask-${shape.id}`}>
                                {shape.type === 'rect' && <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} />}
                                {shape.type === 'ellipse' && <ellipse cx={shape.x + shape.width / 2} cy={shape.y + shape.height / 2} rx={shape.width / 2} ry={shape.height / 2} />}
                                {shape.type === 'path' && <path d={shape.pathData} />}
                            </clipPath>
                        ))}
                    </defs>
                    {shapes.map(shape => {
                        const isSelected = selection === shape.id;
                        const rotation = shape.rotation || 0;
                        const centerX = shape.x + (shape.width || 0) / 2;
                        const centerY = shape.y + (shape.height || 0) / 2;

                        const commonProps = {
                            key: shape.id,
                            fill: shape.fill || 'transparent',
                            stroke: shape.stroke || 'none',
                            strokeWidth: shape.strokeWidth || 0,
                            opacity: shape.opacity || 1,
                            className: 'shape-element',
                            onMouseDown: (e) => handleShapeMouseDown(e, shape.id),
                            onDoubleClick: (e) => handleShapeDoubleClick(e, shape.id),
                            style: {
                                cursor: tool === 'select' ? 'move' : 'pointer',
                                mixBlendMode: shape.blendMode || 'normal'
                            },
                            transform: shape.type !== 'path' ? `rotate(${rotation} ${centerX} ${centerY})` : undefined,
                            clipPath: shape.maskId ? `url(#mask-${shape.maskId})` : undefined
                        };

                        if (shape.type === 'rect') {
                            return (
                                <rect
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    {...commonProps}
                                />
                            );
                        } else if (shape.type === 'ellipse') {
                            return (
                                <ellipse
                                    cx={centerX}
                                    cy={centerY}
                                    rx={shape.width / 2}
                                    ry={shape.height / 2}
                                    {...commonProps}
                                />
                            );
                        } else if (shape.type === 'path') {
                            return (
                                <path
                                    d={shape.pathData}
                                    {...commonProps}
                                />
                            );
                        } else if (shape.type === 'image') {
                            return (
                                <image
                                    key={shape.id}
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    href={shape.imageData}
                                    opacity={shape.opacity || 1}
                                    onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                                    onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)}
                                    style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
                                    transform={`rotate(${rotation} ${centerX} ${centerY})`}
                                    clipPath={shape.maskId ? `url(#mask-${shape.maskId})` : undefined}
                                />
                            );
                        }
                        return null;
                    })}

                    {/* Drawing path preview */}
                    {isDrawing && pathPoints.length > 0 && (
                        <g>
                            <path
                                d={pathPoints.map((p, i) => {
                                    if (i === 0) return `M ${p.x} ${p.y}`;
                                    const prev = pathPoints[i - 1];
                                    return `C ${prev.x + prev.hx} ${prev.y + prev.hy} ${p.x - p.hx} ${p.y - p.hy} ${p.x} ${p.y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                            {pathPoints.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="3" fill="#10b981" />
                                    {/* Handle lines */}
                                    {(p.hx !== 0 || p.hy !== 0) && (
                                        <>
                                            <line x1={p.x} y1={p.y} x2={p.x + p.hx} y2={p.y + p.hy} stroke="#10b981" strokeWidth="1" />
                                            <circle cx={p.x + p.hx} cy={p.y + p.hy} r="2" fill="#10b981" />
                                            <line x1={p.x} y1={p.y} x2={p.x - p.hx} y2={p.y - p.hy} stroke="#10b981" strokeWidth="1" />
                                            <circle cx={p.x - p.hx} cy={p.y - p.hy} r="2" fill="#10b981" />
                                        </>
                                    )}
                                </g>
                            ))}
                        </g>
                    )}

                    {/* Smart Guides */}
                    {smartGuides.map((guide, i) => (
                        <line
                            key={i}
                            x1={guide.type === 'vertical' ? guide.pos : 0}
                            y1={guide.type === 'vertical' ? 0 : guide.pos}
                            x2={guide.type === 'vertical' ? guide.pos : canvasSize.width}
                            y2={guide.type === 'vertical' ? canvasSize.height : guide.pos}
                            stroke="#f59e0b"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            pointerEvents="none"
                        />
                    ))}

                    {/* Bounding Box */}
                    {selectedShape && (
                        <g className="bounding-box">
                            {/* Selection Rectangle */}
                            <rect
                                x={selectedShape.x - 2}
                                y={selectedShape.y - 2}
                                width={(selectedShape.width || 0) + 4}
                                height={(selectedShape.height || 0) + 4}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                pointerEvents="none"
                                transform={selectedShape.type !== 'path' ? `rotate(${selectedShape.rotation || 0} ${selectedShape.x + (selectedShape.width || 0) / 2} ${selectedShape.y + (selectedShape.height || 0) / 2})` : undefined}
                            />

                            {/* Corner Handles */}
                            {['nw', 'ne', 'sw', 'se'].map(handle => {
                                let hx, hy;
                                switch (handle) {
                                    case 'nw': hx = selectedShape.x; hy = selectedShape.y; break;
                                    case 'ne': hx = selectedShape.x + (selectedShape.width || 0); hy = selectedShape.y; break;
                                    case 'sw': hx = selectedShape.x; hy = selectedShape.y + (selectedShape.height || 0); break;
                                    case 'se': hx = selectedShape.x + (selectedShape.width || 0); hy = selectedShape.y + (selectedShape.height || 0); break;
                                }

                                return (
                                    <rect
                                        key={handle}
                                        className="transform-handle"
                                        x={hx - 4}
                                        y={hy - 4}
                                        width="8"
                                        height="8"
                                        fill="#6366f1"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                        style={{ cursor: `${handle}-resize` }}
                                        onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                                    />
                                );
                            })}

                            {/* Path Point Editing */}
                            {selectedShape.type === 'path' && selectedShape.pathPoints && isEditingPath && (
                                <g>
                                    {selectedShape.pathPoints.map((p, i) => (
                                        <g key={i}>
                                            <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r="4"
                                                fill="#6366f1"
                                                stroke="#ffffff"
                                                strokeWidth="2"
                                                style={{ cursor: 'move' }}
                                            />
                                            {(p.hx !== 0 || p.hy !== 0) && (
                                                <>
                                                    <line x1={p.x} y1={p.y} x2={p.x + p.hx} y2={p.y + p.hy} stroke="#6366f1" strokeWidth="1" />
                                                    <circle cx={p.x + p.hx} cy={p.y + p.hy} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                                                </>
                                            )}
                                        </g>
                                    ))}
                                </g>
                            )}

                            {/* Rotation Handle - only for non-path shapes */}
                            {selectedShape.type !== 'path' && (
                                <>
                                    <line
                                        x1={selectedShape.x + (selectedShape.width || 0) / 2}
                                        y1={selectedShape.y - 2}
                                        x2={selectedShape.x + (selectedShape.width || 0) / 2}
                                        y2={selectedShape.y - 25}
                                        stroke="#6366f1"
                                        strokeWidth="1.5"
                                        pointerEvents="none"
                                    />
                                    <circle
                                        className="transform-handle"
                                        cx={selectedShape.x + (selectedShape.width || 0) / 2}
                                        cy={selectedShape.y - 25}
                                        r="5"
                                        fill="#10b981"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                        style={{ cursor: 'grab' }}
                                        onMouseDown={handleRotateMouseDown}
                                    />
                                </>
                            )}
                        </g>
                    )}
                </svg>
            </div>
            {isDrawing && !compact && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-panel)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--accent)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                }}>
                    Click to add points • Double-click to finish
                </div>
            )}
            {isEditingPath && !compact && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-panel)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--accent)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                }}>
                    Editing path • Press ESC or click outside to finish
                    <button
                        onClick={() => setIsEditingPath(false)}
                        style={{
                            marginLeft: '12px',
                            padding: '4px 8px',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};
