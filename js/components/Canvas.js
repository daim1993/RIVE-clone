const React = window.React;
const Canvas = ({ shapes, selection, setSelection, tool, addShape, updateShape, updateShapes, onUpdateEnd, canvasSize, compact = false, setCanvasSize }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isResizing, setIsResizing] = React.useState(false);
    const [isRotating, setIsRotating] = React.useState(false);
    const [dragInfo, setDragInfo] = React.useState(null); // { startX, startY, originalX, originalY }
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 }); // Keep for other tools like pen/resize for now
    const [resizeHandle, setResizeHandle] = React.useState(null);
    const [pathPoints, setPathPoints] = React.useState([]);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [activePointIndex, setActivePointIndex] = React.useState(-1);
    const [smartGuides, setSmartGuides] = React.useState([]);
    const [isEditingPath, setIsEditingPath] = React.useState(false);
    const [editingPathPoints, setEditingPathPoints] = React.useState([]);
    const [draggedPointIndex, setDraggedPointIndex] = React.useState(null);
    const [draggedHandleType, setDraggedHandleType] = React.useState(null); // 'in' or 'out'
    const [artboardOffset, setArtboardOffset] = React.useState({ x: 0, y: 0 });
    const [isDraggingArtboard, setIsDraggingArtboard] = React.useState(false);
    const [draggedShapeId, setDraggedShapeId] = React.useState(null);
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [selectionRect, setSelectionRect] = React.useState(null); // { x, y, width, height }
    const canvasRef = React.useRef(null);
    const containerRef = React.useRef(null);

    // Refs for event listeners to avoid stale closures
    const stateRef = React.useRef({
        shapes, selection, tool, canvasSize,
        isDragging, isResizing, isRotating, isSelecting, isDrawing, isEditingPath,
        dragStart, dragInfo, resizeHandle, pathPoints, activePointIndex,
        draggedPointIndex, draggedHandleType, artboardOffset, isDraggingArtboard,
        draggedShapeId, selectionRect
    });

    React.useEffect(() => {
        stateRef.current = {
            shapes, selection, tool, canvasSize,
            isDragging, isResizing, isRotating, isSelecting, isDrawing, isEditingPath,
            dragStart, dragInfo, resizeHandle, pathPoints, activePointIndex,
            draggedPointIndex, draggedHandleType, artboardOffset, isDraggingArtboard,
            draggedShapeId, selectionRect
        };
    }, [shapes, selection, tool, canvasSize, isDragging, isResizing, isRotating, isSelecting, isDrawing, isEditingPath, dragStart, dragInfo, resizeHandle, pathPoints, activePointIndex, draggedPointIndex, draggedHandleType, artboardOffset, isDraggingArtboard, draggedShapeId, selectionRect]);

    // Center artboard on mount and when canvas size changes
    React.useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            console.log('Canvas Container Size:', width, height);
            console.log('Artboard Size:', canvasSize.width, canvasSize.height);

            const newX = (width - canvasSize.width) / 2;
            const newY = (height - canvasSize.height) / 2;
            console.log('New Artboard Offset:', newX, newY);

            setArtboardOffset({
                x: newX,
                y: newY
            });
        } else {
            console.warn('Canvas container ref is null');
        }
    }, [canvasSize]);

    const snapToGuides = (x, y, width, height, excludeId) => {
        const SNAP_THRESHOLD = 5;
        const guides = [];
        let newX = x;
        let newY = y;

        // Edges to check: [value, type]
        // type: 0=start, 1=center, 2=end
        const horizontalTargets = [];
        const verticalTargets = [];

        // Add canvas center
        horizontalTargets.push({ value: canvasSize.width / 2, type: 1 });
        verticalTargets.push({ value: canvasSize.height / 2, type: 1 });

        // Add other shapes
        shapes.forEach(shape => {
            if (shape.id === excludeId) return;
            horizontalTargets.push({ value: shape.x, type: 0 });
            horizontalTargets.push({ value: shape.x + shape.width / 2, type: 1 });
            horizontalTargets.push({ value: shape.x + shape.width, type: 2 });

            verticalTargets.push({ value: shape.y, type: 0 });
            verticalTargets.push({ value: shape.y + shape.height / 2, type: 1 });
            verticalTargets.push({ value: shape.y + shape.height, type: 2 });
        });

        // Check horizontal snaps (vertical lines)
        // Edges of current shape: left, center, right
        const myHorizontals = [
            { value: x, offset: 0 },
            { value: x + width / 2, offset: width / 2 },
            { value: x + width, offset: width }
        ];

        let snappedX = false;
        for (const myH of myHorizontals) {
            if (snappedX) break;
            for (const target of horizontalTargets) {
                if (Math.abs(myH.value - target.value) < SNAP_THRESHOLD) {
                    newX = target.value - myH.offset;
                    guides.push({ type: 'vertical', x: target.value, y1: 0, y2: canvasSize.height });
                    snappedX = true;
                    break;
                }
            }
        }

        // Check vertical snaps (horizontal lines)
        const myVerticals = [
            { value: y, offset: 0 },
            { value: y + height / 2, offset: height / 2 },
            { value: y + height, offset: height }
        ];

        let snappedY = false;
        for (const myV of myVerticals) {
            if (snappedY) break;
            for (const target of verticalTargets) {
                if (Math.abs(myV.value - target.value) < SNAP_THRESHOLD) {
                    newY = target.value - myV.offset;
                    guides.push({ type: 'horizontal', y: target.value, x1: 0, x2: canvasSize.width });
                    snappedY = true;
                    break;
                }
            }
        }

        setSmartGuides(guides);
        return { x: newX, y: newY };
    };

    const getCanvasCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    // Build tree for rendering
    const buildTree = (items) => {
        const itemMap = {};
        const roots = [];
        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });
        items.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                roots.push(itemMap[item.id]);
            }
        });
        return roots;
    };

    const finishPath = (closed = false) => {
        if (pathPoints.length < 2) return;

        const points = [...pathPoints];

        const bounds = points.reduce((acc, p) => ({
            minX: Math.min(acc.minX, p.x),
            minY: Math.min(acc.minY, p.y),
            maxX: Math.max(acc.maxX, p.x),
            maxY: Math.max(acc.maxY, p.y)
        }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

        // Normalize points to be relative to bounds
        const relativePoints = points.map(p => ({
            ...p,
            x: p.x - bounds.minX,
            y: p.y - bounds.minY
        }));

        const pathData = relativePoints.map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = relativePoints[i - 1];
            return `C ${prev.x + prev.hx} ${prev.y + prev.hy} ${p.x - p.hx} ${p.y - p.hy} ${p.x} ${p.y}`;
        }).join(' ');

        const finalPathData = closed ? pathData + ' Z' : pathData;

        addShape({
            type: 'path',
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
            pathData: finalPathData,
            pathPoints: relativePoints,
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
            // Start drag selection
            setIsSelecting(true);
            setIsDragging(true);
            setDragStart(coords);
            if (!e.shiftKey) {
                setSelection([]);
            }
            setIsEditingPath(false);
        } else if (tool === 'artboard') {
            // Artboard resize start
        }
    };

    const handleCanvasDoubleClick = (e) => {
        if (tool === 'pen' && isDrawing && pathPoints.length > 1) {
            finishPath(false);
        }
    };

    const handleShapeMouseDown = (e, shapeId) => {
        e.stopPropagation();
        if (tool === 'artboard') return;

        let newSelection = [...selection];
        if (e.shiftKey) {
            if (newSelection.includes(shapeId)) {
                newSelection = newSelection.filter(id => id !== shapeId);
            } else {
                newSelection.push(shapeId);
            }
            setSelection(newSelection);
        } else {
            if (!newSelection.includes(shapeId)) {
                setSelection([shapeId]);
            }
        }

        setIsDragging(true);
        setDraggedShapeId(shapeId);

        const coords = getCanvasCoords(e);
        const shape = shapes.find(s => s.id === shapeId);

        // Store initial positions for ALL selected shapes to prevent drift
        // If the clicked shape wasn't selected (and no shift), it is now the only selection
        const currentSelection = e.shiftKey ? newSelection : (newSelection.includes(shapeId) ? newSelection : [shapeId]);

        const initialPositions = {};
        currentSelection.forEach(id => {
            const s = shapes.find(item => item.id === id);
            if (s) {
                initialPositions[id] = { x: s.x, y: s.y };
            }
        });

        setDragInfo({
            startX: coords.x,
            startY: coords.y,
            initialPositions: initialPositions
        });
        setDragStart(coords);
    };

    const convertToPath = (shape) => {
        let points = [];
        // Generate points relative to shape origin (0,0)
        if (shape.type === 'rect') {
            points = [
                { x: 0, y: 0, hx: 0, hy: 0 },
                { x: shape.width, y: 0, hx: 0, hy: 0 },
                { x: shape.width, y: shape.height, hx: 0, hy: 0 },
                { x: 0, y: shape.height, hx: 0, hy: 0 }
            ];
        } else if (shape.type === 'ellipse') {
            const rx = shape.width / 2;
            const ry = shape.height / 2;
            const cx = rx; // Center relative to top-left
            const cy = ry;
            const k = 0.5522847498;

            points = [
                { x: cx, y: cy - ry, hx: rx * k, hy: 0 },
                { x: cx + rx, y: cy, hx: 0, hy: ry * k },
                { x: cx, y: cy + ry, hx: -rx * k, hy: 0 },
                { x: cx - rx, y: cy, hx: 0, hy: -ry * k }
            ];
        }

        if (points.length > 0) {
            const pathData = points.map((p, i) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = points[i - 1];
                return `C ${prev.x + prev.hx} ${prev.y + prev.hy} ${p.x - p.hx} ${p.y - p.hy} ${p.x} ${p.y}`;
            }).join(' ') + ' Z';

            updateShape(shape.id, {
                type: 'path',
                pathPoints: points,
                pathData: pathData
            });
            return points;
        }
        return null;
    };

    const handleShapeDoubleClick = (e, shapeId) => {
        e.stopPropagation();
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return;

        if (shape.type === 'path') {
            setIsEditingPath(true);
            setEditingPathPoints(shape.pathPoints || []);
            setSelection([shapeId]);
        } else if (shape.type === 'rect' || shape.type === 'ellipse') {
            // Convert to path
            const points = convertToPath(shape);
            if (points) {
                setIsEditingPath(true);
                setEditingPathPoints(points);
                setSelection([shapeId]);
            }
        }
    };

    const handleResizeMouseDown = (e, handle) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
        const coords = getCanvasCoords(e);
        setDragStart(coords);

        // Store initial bounds and shapes for multi-selection
        const bounds = calculateMultiSelectionBounds();
        const initialShapes = {};
        selection.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
                initialShapes[id] = { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
            }
        });
        setDragInfo({ initialBounds: bounds, initialShapes });
    };

    const handleRotateMouseDown = (e) => {
        e.stopPropagation();
        setIsRotating(true);
        const coords = getCanvasCoords(e);
        setDragStart(coords);

        // Store initial bounds and shapes for multi-selection
        const bounds = calculateMultiSelectionBounds();
        const initialShapes = {};
        selection.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
                initialShapes[id] = {
                    x: shape.x,
                    y: shape.y,
                    width: shape.width,
                    height: shape.height,
                    rotation: shape.rotation || 0
                };
            }
        });
        setDragInfo({ initialBounds: bounds, initialShapes });
    };

    // Store handlers in refs to avoid stale closures
    const handlersRef = React.useRef({});

    handlersRef.current.handleMouseMove = (e) => {
        const {
            shapes, selection, tool, canvasSize,
            isDragging, isResizing, isRotating, isSelecting, isDrawing, isEditingPath,
            dragStart, dragInfo, resizeHandle, pathPoints, activePointIndex,
            draggedPointIndex, draggedHandleType, artboardOffset, isDraggingArtboard,
            draggedShapeId
        } = stateRef.current;

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

        // Artboard dragging
        if (tool === 'artboard' && isDraggingArtboard) {
            setArtboardOffset({
                x: artboardOffset.x + dx,
                y: artboardOffset.y + dy
            });
            setDragStart(coords);
            return;
        }

        // Selection rectangle dragging
        if (isSelecting && tool === 'select') {
            const rectX = Math.min(dragStart.x, coords.x);
            const rectY = Math.min(dragStart.y, coords.y);
            const rectWidth = Math.abs(coords.x - dragStart.x);
            const rectHeight = Math.abs(coords.y - dragStart.y);
            setSelectionRect({ x: rectX, y: rectY, width: rectWidth, height: rectHeight });
            return;
        }

        // Artboard resizing
        if (tool === 'artboard' && isResizing && resizeHandle) {
            const newSize = { ...canvasSize };
            switch (resizeHandle) {
                case 'e': newSize.width += dx; break;
                case 's': newSize.height += dy; break;
                case 'se': newSize.width += dx; newSize.height += dy; break;
            }
            if (newSize.width > 100 && newSize.height > 100) {
                setCanvasSize(newSize);
                setDragStart(coords);
            }
            return;
        }

        if (!selection || selection.length === 0) return;

        const selectedShape = shapes.find(s => s.id === (draggedShapeId || selection[0]));
        if (!selectedShape) return;

        // Path point editing
        if (isEditingPath && draggedPointIndex !== null && dragInfo && dragInfo.initialPoints) {
            const dx = coords.x - dragInfo.startX;
            const dy = coords.y - dragInfo.startY;

            // We need to work in ABSOLUTE coordinates to recalculate bounds
            const initialShapeX = dragInfo.shapeX;
            const initialShapeY = dragInfo.shapeY;

            // 1. Calculate new absolute positions for ALL points
            const absolutePoints = dragInfo.initialPoints.map((p, i) => {
                let absX = initialShapeX + p.x;
                let absY = initialShapeY + p.y;
                let hx = p.hx;
                let hy = p.hy;

                if (i === draggedPointIndex) {
                    if (draggedHandleType === 'out') {
                        // Dragging outgoing handle
                        // Handle is relative to point. Point hasn't moved, but handle has.
                        // We need to calculate new hx/hy based on mouse position
                        // Mouse pos = coords.x, coords.y
                        // Point pos (absolute) = initialShapeX + p.x, initialShapeY + p.y
                        hx = coords.x - (initialShapeX + p.x);
                        hy = coords.y - (initialShapeY + p.y);
                    } else if (draggedHandleType === 'in') {
                        // Dragging incoming handle (mirror)
                        hx = -(coords.x - (initialShapeX + p.x));
                        hy = -(coords.y - (initialShapeY + p.y));
                    } else {
                        // Dragging the point itself
                        absX += dx;
                        absY += dy;
                    }
                }
                return { x: absX, y: absY, hx, hy };
            });

            // 2. Calculate new bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            absolutePoints.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });

            // 3. Normalize points to new bounding box
            const newWidth = Math.max(1, maxX - minX);
            const newHeight = Math.max(1, maxY - minY);

            const normalizedPoints = absolutePoints.map(p => ({
                x: p.x - minX,
                y: p.y - minY,
                hx: p.hx,
                hy: p.hy
            }));

            // 4. Update shape
            const pathData = normalizedPoints.map((p, i) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = normalizedPoints[i - 1];
                return `C ${prev.x + prev.hx} ${prev.y + prev.hy} ${p.x - p.hx} ${p.y - p.hy} ${p.x} ${p.y}`;
            }).join(' ');

            updateShape(selectedShape.id, {
                x: minX,
                y: minY,
                width: newWidth,
                height: newHeight,
                pathPoints: normalizedPoints,
                pathData: selectedShape.fill !== 'none' ? pathData + ' Z' : pathData
            });
            return;
        }

        if (isDragging && !isEditingPath && dragInfo && dragInfo.initialPositions) {
            const dx = coords.x - dragInfo.startX;
            const dy = coords.y - dragInfo.startY;

            // Calculate new position for the "leader" shape (the one being dragged)
            // to determine snapping
            const leaderId = draggedShapeId || selection[0];
            const leaderInitial = dragInfo.initialPositions[leaderId];

            if (!leaderInitial) return;

            let newLeaderX = leaderInitial.x + dx;
            let newLeaderY = leaderInitial.y + dy;

            // Apply snapping for the leader
            const leaderShape = shapes.find(s => s.id === leaderId);
            const snapped = snapToGuides(
                newLeaderX,
                newLeaderY,
                leaderShape.width || 0,
                leaderShape.height || 0,
                leaderId
            );

            // Calculate the ACTUAL delta applied after snapping
            const snappedDx = snapped.x - leaderInitial.x;
            const snappedDy = snapped.y - leaderInitial.y;

            // Apply this snapped delta to ALL selected shapes
            const updates = [];
            selection.forEach(id => {
                const initial = dragInfo.initialPositions[id];
                if (initial) {
                    updates.push({
                        id: id,
                        props: {
                            x: initial.x + snappedDx,
                            y: initial.y + snappedDy
                        }
                    });
                }
            });
            updateShapes(updates);

            // Do NOT update dragInfo here to prevent drift
        } else if (isResizing && resizeHandle && dragInfo && dragInfo.initialBounds) {
            const bounds = dragInfo.initialBounds;
            const initialShapes = dragInfo.initialShapes;

            // Calculate new bounds based on handle drag
            let newBounds = { ...bounds };

            switch (resizeHandle) {
                case 'nw':
                    newBounds.width = bounds.width - dx;
                    newBounds.height = bounds.height - dy;
                    newBounds.x = bounds.x + dx;
                    newBounds.y = bounds.y + dy;
                    break;
                case 'ne':
                    newBounds.width = bounds.width + dx;
                    newBounds.height = bounds.height - dy;
                    newBounds.y = bounds.y + dy;
                    break;
                case 'sw':
                    newBounds.width = bounds.width - dx;
                    newBounds.height = bounds.height + dy;
                    newBounds.x = bounds.x + dx;
                    break;
                case 'se':
                    newBounds.width = bounds.width + dx;
                    newBounds.height = bounds.height + dy;
                    break;
            }

            if (newBounds.width > 10 && newBounds.height > 10) {
                // Calculate scale factors
                const scaleX = newBounds.width / bounds.width;
                const scaleY = newBounds.height / bounds.height;

                // Apply to all selected shapes
                const updates = [];
                selection.forEach(id => {
                    const initial = initialShapes[id];
                    if (initial) {
                        // Calculate relative position within original bounds
                        const relX = (initial.x - bounds.x) / bounds.width;
                        const relY = (initial.y - bounds.y) / bounds.height;
                        const relW = initial.width / bounds.width;
                        const relH = initial.height / bounds.height;

                        // Apply to new bounds
                        updates.push({
                            id: id,
                            props: {
                                x: newBounds.x + relX * newBounds.width,
                                y: newBounds.y + relY * newBounds.height,
                                width: relW * newBounds.width,
                                height: relH * newBounds.height
                            }
                        });
                    }
                });
                updateShapes(updates);
            }
        } else if (isRotating && dragInfo && dragInfo.initialBounds) {
            const bounds = dragInfo.initialBounds;
            const initialShapes = dragInfo.initialShapes;
            const centerX = bounds.centerX;
            const centerY = bounds.centerY;

            const angle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
            let finalAngle = Math.round(angle);
            if (e.shiftKey) {
                finalAngle = Math.round(finalAngle / 45) * 45;
            }

            // Calculate rotation delta
            const startAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX) * (180 / Math.PI);
            const rotationDelta = finalAngle - startAngle;

            // Apply rotation to all selected shapes
            const updates = [];
            selection.forEach(id => {
                const initial = initialShapes[id];
                if (initial) {
                    // Rotate shape's center around group center
                    const shapeCenterX = initial.x + initial.width / 2;
                    const shapeCenterY = initial.y + initial.height / 2;

                    const angleRad = (rotationDelta * Math.PI) / 180;
                    const cos = Math.cos(angleRad);
                    const sin = Math.sin(angleRad);

                    const dx = shapeCenterX - centerX;
                    const dy = shapeCenterY - centerY;

                    const newCenterX = centerX + (dx * cos - dy * sin);
                    const newCenterY = centerY + (dx * sin + dy * cos);

                    updates.push({
                        id: id,
                        props: {
                            x: newCenterX - initial.width / 2,
                            y: newCenterY - initial.height / 2,
                            rotation: (initial.rotation || 0) + rotationDelta
                        }
                    });
                }
            });
            updateShapes(updates);
        }
    };

    handlersRef.current.handleMouseUp = (e) => {
        const {
            shapes, selection, tool, canvasSize,
            isDragging, isResizing, isRotating, isSelecting, isDrawing, isEditingPath,
            dragStart, dragInfo, resizeHandle, pathPoints, activePointIndex,
            draggedPointIndex, draggedHandleType, artboardOffset, isDraggingArtboard,
            draggedShapeId, selectionRect
        } = stateRef.current;

        if (tool === 'pen' && isDragging && !isEditingPath) {
            setIsDragging(false);
            return;
        }

        // Handle selection rectangle
        if (isSelecting && selectionRect) {
            const selectedIds = [];
            shapes.forEach(shape => {
                // Check if shape intersects with selection rectangle
                const shapeRight = shape.x + (shape.width || 0);
                const shapeBottom = shape.y + (shape.height || 0);
                const rectRight = selectionRect.x + selectionRect.width;
                const rectBottom = selectionRect.y + selectionRect.height;

                // Intersection test
                if (!(shape.x > rectRight ||
                    shapeRight < selectionRect.x ||
                    shape.y > rectBottom ||
                    shapeBottom < selectionRect.y)) {
                    selectedIds.push(shape.id);
                }
            });

            if (e && e.shiftKey) {
                // Add to existing selection
                const newSelection = [...new Set([...selection, ...selectedIds])];
                setSelection(newSelection);
            } else {
                setSelection(selectedIds);
            }

            setSelectionRect(null);
            setIsSelecting(false);
        }

        if (isDragging || isResizing || isRotating || draggedPointIndex !== null || isDraggingArtboard) {
            if (onUpdateEnd) onUpdateEnd();
        }
        setIsDragging(false);
        setIsResizing(false);
        setIsRotating(false);
        setResizeHandle(null);
        setSmartGuides([]);
        setDraggedPointIndex(null);
        setDraggedHandleType(null);
        setDraggedShapeId(null);
        setIsDraggingArtboard(false);
        setDragInfo(null);
    };

    React.useEffect(() => {
        const handleMove = (e) => handlersRef.current.handleMouseMove(e);
        const handleUp = (e) => handlersRef.current.handleMouseUp(e);

        if (isDragging || isResizing || isRotating || isSelecting) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            return () => {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
            };
        }
    }, [isDragging, isResizing, isRotating, isSelecting]);

    const selectedShape = selection.length > 0 ? shapes.find(s => s.id === selection[0]) : null;
    const tree = buildTree(shapes);

    // Helper to get filter URL for a shape
    const getShapeFilter = (shape) => {
        if (shape.glassEffect) {
            return `url(#glass-${shape.id})`;
        } else if (shape.blur && shape.blur > 0) {
            return `url(#blur-${shape.id})`;
        }
        return null;
    };

    // Calculate unified bounding box for multiple selections
    const calculateMultiSelectionBounds = () => {
        if (selection.length === 0) return null;
        if (selection.length === 1) {
            const shape = shapes.find(s => s.id === selection[0]);
            if (!shape) return null;
            return {
                x: shape.x,
                y: shape.y,
                width: shape.width || 0,
                height: shape.height || 0,
                centerX: shape.x + (shape.width || 0) / 2,
                centerY: shape.y + (shape.height || 0) / 2,
                rotation: shape.rotation || 0,
                isSingleSelection: true
            };
        }

        // Multiple selections - calculate axis-aligned bounds that encompass all rotated shapes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        selection.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
                const rotation = (shape.rotation || 0) * Math.PI / 180;
                const w = shape.width || 0;
                const h = shape.height || 0;
                const cx = shape.x + w / 2;
                const cy = shape.y + h / 2;

                // Calculate corners of rotated rectangle
                const corners = [
                    { x: -w / 2, y: -h / 2 },
                    { x: w / 2, y: -h / 2 },
                    { x: w / 2, y: h / 2 },
                    { x: -w / 2, y: h / 2 }
                ];

                corners.forEach(corner => {
                    const rotatedX = cx + (corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation));
                    const rotatedY = cy + (corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation));
                    minX = Math.min(minX, rotatedX);
                    minY = Math.min(minY, rotatedY);
                    maxX = Math.max(maxX, rotatedX);
                    maxY = Math.max(maxY, rotatedY);
                });
            }
        });

        const width = maxX - minX;
        const height = maxY - minY;

        return {
            x: minX,
            y: minY,
            width,
            height,
            centerX: minX + width / 2,
            centerY: minY + height / 2,
            rotation: 0,
            isSingleSelection: false
        };
    };

    const renderBoundingBox = (bounds) => {
        if (!bounds) return null;

        // For single selection with rotation, render rotated bounding box
        if (bounds.isSingleSelection && bounds.rotation) {
            const transform = `rotate(${bounds.rotation} ${bounds.centerX} ${bounds.centerY})`;
            return (
                <g className="bounding-box" transform={transform}>
                    <rect
                        x={bounds.x - 2}
                        y={bounds.y - 2}
                        width={bounds.width + 4}
                        height={bounds.height + 4}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        pointerEvents="none"
                    />
                    {/* Handles */}
                    {['nw', 'ne', 'sw', 'se'].map(handle => {
                        let hx, hy;
                        const w = bounds.width;
                        const h = bounds.height;
                        switch (handle) {
                            case 'nw': hx = bounds.x; hy = bounds.y; break;
                            case 'ne': hx = bounds.x + w; hy = bounds.y; break;
                            case 'sw': hx = bounds.x; hy = bounds.y + h; break;
                            case 'se': hx = bounds.x + w; hy = bounds.y + h; break;
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
                                style={{ cursor: `${handle}-resize`, pointerEvents: 'auto' }}
                                onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                            />
                        );
                    })}
                    {/* Rotation Handle */}
                    <line x1={bounds.x + bounds.width / 2} y1={bounds.y} x2={bounds.x + bounds.width / 2} y2={bounds.y - 25} stroke="#6366f1" strokeWidth="1.5" />
                    <circle
                        cx={bounds.x + bounds.width / 2}
                        cy={bounds.y - 25}
                        r="5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        style={{ cursor: 'grab', pointerEvents: 'auto' }}
                        onMouseDown={handleRotateMouseDown}
                    />
                </g>
            );
        }

        // For multiple selections or non-rotated, render axis-aligned box
        return (
            <g className="bounding-box" pointerEvents="none">
                <rect
                    x={bounds.x - 2}
                    y={bounds.y - 2}
                    width={bounds.width + 4}
                    height={bounds.height + 4}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                />
                {/* Handles */}
                {['nw', 'ne', 'sw', 'se'].map(handle => {
                    let hx, hy;
                    const w = bounds.width;
                    const h = bounds.height;
                    switch (handle) {
                        case 'nw': hx = bounds.x; hy = bounds.y; break;
                        case 'ne': hx = bounds.x + w; hy = bounds.y; break;
                        case 'sw': hx = bounds.x; hy = bounds.y + h; break;
                        case 'se': hx = bounds.x + w; hy = bounds.y + h; break;
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
                            style={{ cursor: `${handle}-resize`, pointerEvents: 'auto' }}
                            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                        />
                    );
                })}\n                {/* Rotation Handle */}
                <line x1={bounds.x + bounds.width / 2} y1={bounds.y} x2={bounds.x + bounds.width / 2} y2={bounds.y - 25} stroke="#6366f1" strokeWidth="1.5" />
                <circle
                    cx={bounds.x + bounds.width / 2}
                    cy={bounds.y - 25}
                    r="5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ cursor: 'grab', pointerEvents: 'auto' }}
                    onMouseDown={handleRotateMouseDown}
                />
            </g>
        );
    };

    const renderShapeMask = (shape) => {
        const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation || 0} ${(shape.width || 0) / 2} ${(shape.height || 0) / 2}) scale(${shape.scaleX || 1}, ${shape.scaleY || 1})`;

        return (
            <g transform={transform}>
                {shape.type === 'rect' && (() => {
                    const w = shape.width;
                    const h = shape.height;
                    const rTL = Math.min(shape.cornerRadiusTL ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rTR = Math.min(shape.cornerRadiusTR ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rBR = Math.min(shape.cornerRadiusBR ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rBL = Math.min(shape.cornerRadiusBL ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const hasIndividualCorners = shape.cornerRadiusTL !== undefined || shape.cornerRadiusTR !== undefined || shape.cornerRadiusBR !== undefined || shape.cornerRadiusBL !== undefined;

                    if (!hasIndividualCorners) {
                        return <rect width={w} height={h} rx={shape.cornerRadius || 0} ry={shape.cornerRadius || 0} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} />;
                    }

                    const pathData = `
                        M ${rTL} 0
                        L ${w - rTR} 0
                        ${rTR > 0 ? `Q ${w} 0 ${w} ${rTR}` : ''}
                        L ${w} ${h - rBR}
                        ${rBR > 0 ? `Q ${w} ${h} ${w - rBR} ${h}` : ''}
                        L ${rBL} ${h}
                        ${rBL > 0 ? `Q 0 ${h} 0 ${h - rBL}` : ''}
                        L 0 ${rTL}
                        ${rTL > 0 ? `Q 0 0 ${rTL} 0` : ''}
                        Z
                    `.replace(/\s+/g, ' ').trim();
                    return <path d={pathData} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} />;
                })()}
                {shape.type === 'ellipse' && <ellipse cx={shape.width / 2} cy={shape.height / 2} rx={shape.width / 2} ry={shape.height / 2} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} />}
                {shape.type === 'path' && <path d={shape.pathData} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} />}
                {shape.type === 'image' && <image href={shape.imageData} width={shape.width} height={shape.height} opacity={shape.opacity} />}
            </g>
        );
    };

    const renderShapeRecursiveWithSelection = (shape, maskShape = null) => {
        const isSelected = selection.includes(shape.id);
        const rotation = shape.rotation || 0;

        // If this shape is marked as a mask, don't render it directly
        if (shape.isMask) return null;

        const transform = `translate(${shape.x}, ${shape.y}) rotate(${rotation} ${(shape.width || 0) / 2} ${(shape.height || 0) / 2}) scale(${shape.scaleX || 1}, ${shape.scaleY || 1})`;

        // Skip rendering glass shapes in SVG - they're rendered as HTML overlays
        if (shape.glassEffect) {
            return (
                <g key={shape.id} transform={transform}>
                    {/* Children still need to render */}
                    {shape.children && shape.children.map(child => renderShapeRecursiveWithSelection(child))}
                </g>
            );
        }

        // Determine which mask to use (passed from parent or none)
        const maskId = maskShape ? `mask-${maskShape.id}` : null;

        return (
            <g key={shape.id} transform={transform}>
                {/* Shape Content */}
                {shape.type === 'rect' && (() => {
                    // Check if we have individual corner radii
                    const hasTL = shape.cornerRadiusTL !== undefined && shape.cornerRadiusTL !== null;
                    const hasTR = shape.cornerRadiusTR !== undefined && shape.cornerRadiusTR !== null;
                    const hasBR = shape.cornerRadiusBR !== undefined && shape.cornerRadiusBR !== null;
                    const hasBL = shape.cornerRadiusBL !== undefined && shape.cornerRadiusBL !== null;
                    const hasIndividualCorners = hasTL || hasTR || hasBR || hasBL;

                    if (!hasIndividualCorners) {
                        // Use simple rect with uniform corner radius
                        // Use simple rect with uniform corner radius
                        return <rect
                            width={shape.width}
                            height={shape.height}
                            rx={shape.cornerRadius || 0}
                            ry={shape.cornerRadius || 0}
                            fill={shape.fill}
                            stroke={shape.stroke}
                            strokeWidth={shape.strokeWidth}
                            opacity={shape.opacity}
                            filter={getShapeFilter(shape)}

                            style={{ mixBlendMode: shape.blendMode }}
                            onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                            onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)}
                        />;
                    }

                    // Generate path with individual corner radii
                    const w = shape.width;
                    const h = shape.height;
                    const rTL = Math.min(shape.cornerRadiusTL ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rTR = Math.min(shape.cornerRadiusTR ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rBR = Math.min(shape.cornerRadiusBR ?? shape.cornerRadius ?? 0, w / 2, h / 2);
                    const rBL = Math.min(shape.cornerRadiusBL ?? shape.cornerRadius ?? 0, w / 2, h / 2);

                    const pathData = `
                        M ${rTL} 0
                        L ${w - rTR} 0
                        ${rTR > 0 ? `Q ${w} 0 ${w} ${rTR}` : ''}
                        L ${w} ${h - rBR}
                        ${rBR > 0 ? `Q ${w} ${h} ${w - rBR} ${h}` : ''}
                        L ${rBL} ${h}
                        ${rBL > 0 ? `Q 0 ${h} 0 ${h - rBL}` : ''}
                        L 0 ${rTL}
                        ${rTL > 0 ? `Q 0 0 ${rTL} 0` : ''}
                        Z
                    `.replace(/\s+/g, ' ').trim();

                    return <path
                        d={pathData}
                        fill={shape.fill}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        opacity={shape.opacity}
                        filter={getShapeFilter(shape)}
                        mask={maskId ? `url(#${maskId})` : undefined}
                        style={{ mixBlendMode: shape.blendMode }}
                        onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                        onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)}
                    />;
                })()}
                {shape.type === 'ellipse' && <ellipse cx={shape.width / 2} cy={shape.height / 2} rx={shape.width / 2} ry={shape.height / 2} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} filter={getShapeFilter(shape)} style={{ mixBlendMode: shape.blendMode }} onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)} />}
                {shape.type === 'path' && <path d={shape.pathData} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} opacity={shape.opacity} filter={getShapeFilter(shape)} style={{ mixBlendMode: shape.blendMode }} onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)} />}
                {shape.type === 'image' && <image href={shape.imageData} width={shape.width} height={shape.height} opacity={shape.opacity} filter={getShapeFilter(shape)} style={{ mixBlendMode: shape.blendMode }} onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)} />}
                {shape.type === 'group' && <rect width={50} height={50} fill="none" stroke={isSelected ? "#6366f1" : "none"} strokeDasharray="2 2" onMouseDown={(e) => handleShapeMouseDown(e, shape.id)} />}

                {/* Children */}
                {shape.children && (() => {
                    // Find mask shape among children (first child with isMask: true)
                    const maskChild = shape.children.find(c => c.isMask);

                    // Render non-mask children
                    return shape.children.map(child => {
                        if (child.isMask) {
                            // Don't render mask children directly
                            return null;
                        }
                        // Pass the mask to siblings
                        return renderShapeRecursiveWithSelection(child, maskChild);
                    });
                })()}

                {/* Path Editing Points with Bezier Handles */}
                {isSelected && isEditingPath && (shape.type === 'path' || (isEditingPath && selection.includes(shape.id))) && (
                    <g>
                        {(shape.pathPoints || editingPathPoints).map((p, i) => (
                            <g key={i}>
                                {/* Bezier handles */}
                                {(p.hx !== 0 || p.hy !== 0) && (
                                    <>
                                        {/* Handle lines */}
                                        <line
                                            x1={p.x}
                                            y1={p.y}
                                            x2={p.x + p.hx}
                                            y2={p.y + p.hy}
                                            stroke="#10b981"
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                        />
                                        <line
                                            x1={p.x}
                                            y1={p.y}
                                            x2={p.x - p.hx}
                                            y2={p.y - p.hy}
                                            stroke="#10b981"
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                        />
                                        {/* Outgoing handle */}
                                        <circle
                                            cx={p.x + p.hx}
                                            cy={p.y + p.hy}
                                            r="4"
                                            fill="#10b981"
                                            stroke="#fff"
                                            strokeWidth="1"
                                            style={{ cursor: 'move', pointerEvents: 'auto' }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setIsDragging(true);
                                                setDraggedPointIndex(i);
                                                setDraggedHandleType('out');
                                                const coords = getCanvasCoords(e);
                                                setDragStart(coords);
                                                setDragInfo({
                                                    startX: coords.x,
                                                    startY: coords.y,
                                                    shapeX: selectedShape.x,
                                                    shapeY: selectedShape.y,
                                                    initialPoints: JSON.parse(JSON.stringify(shape.pathPoints || editingPathPoints || []))
                                                });
                                            }}
                                        />
                                        {/* Incoming handle */}
                                        <circle
                                            cx={p.x - p.hx}
                                            cy={p.y - p.hy}
                                            r="4"
                                            fill="#10b981"
                                            stroke="#fff"
                                            strokeWidth="1"
                                            style={{ cursor: 'move', pointerEvents: 'auto' }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setIsDragging(true);
                                                setDraggedPointIndex(i);
                                                setDraggedHandleType('in');
                                                const coords = getCanvasCoords(e);
                                                setDragStart(coords);
                                                setDragInfo({
                                                    startX: coords.x,
                                                    startY: coords.y,
                                                    shapeX: selectedShape.x,
                                                    shapeY: selectedShape.y,
                                                    initialPoints: JSON.parse(JSON.stringify(shape.pathPoints || editingPathPoints || []))
                                                });
                                            }}
                                        />
                                    </>
                                )}
                                {/* Point itself */}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="6"
                                    fill="#6366f1"
                                    stroke="#fff"
                                    strokeWidth="2"
                                    style={{ cursor: 'move', pointerEvents: 'auto' }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setIsDragging(true);
                                        setDraggedPointIndex(i);
                                        setDraggedHandleType(null);
                                        const coords = getCanvasCoords(e);
                                        setDragStart(coords);
                                        setDragInfo({
                                            startX: coords.x,
                                            startY: coords.y,
                                            shapeX: selectedShape.x,
                                            shapeY: selectedShape.y,
                                            initialPoints: JSON.parse(JSON.stringify(shape.pathPoints || editingPathPoints || []))
                                        });
                                    }}
                                />
                            </g>
                        ))}
                    </g>
                )}
            </g>
        );
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={handleCanvasDoubleClick}
        >
            <div
                className="artboard"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    position: 'absolute',
                    left: artboardOffset.x,
                    top: artboardOffset.y,
                    border: tool === 'artboard' ? '2px solid #10b981' : '1px solid var(--border-color)'
                }}
                ref={canvasRef}
            >
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <defs>
                        {/* Blur and Glass Effect Filters */}
                        {shapes.map(shape => {
                            const filters = [];

                            // Regular blur filter
                            if (shape.blur && shape.blur > 0) {
                                filters.push(
                                    <filter key={`blur-${shape.id}`} id={`blur-${shape.id}`}>
                                        <feGaussianBlur in="SourceGraphic" stdDeviation={shape.blur} />
                                    </filter>
                                );
                            }

                            // Glass effect filter (simple blur for now)
                            if (shape.glassEffect) {
                                const glassBlur = shape.glassBlur || 10;
                                filters.push(
                                    <filter key={`glass-${shape.id}`} id={`glass-${shape.id}`}>
                                        <feGaussianBlur in="SourceGraphic" stdDeviation={glassBlur} />
                                    </filter>
                                );
                            }

                            return filters;
                        })}

                        {/* Mask Definitions */}
                        {shapes.filter(s => s.isMask).map(maskShape => (
                            <mask
                                key={`mask-${maskShape.id}`}
                                id={`mask-${maskShape.id}`}
                                maskUnits="userSpaceOnUse"
                                maskContentUnits="userSpaceOnUse"
                                x="0" y="0" width={canvasSize.width} height={canvasSize.height}
                            >
                                {renderShapeMask(maskShape)}
                            </mask>
                        ))}
                    </defs>
                    {tree.map(root => renderShapeRecursiveWithSelection(root))}

                    {/* Unified Bounding Box for Selection */}
                    {selection.length > 0 && !isEditingPath && renderBoundingBox(calculateMultiSelectionBounds())}

                    {/* Drawing Preview */}
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
                                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
                            ))}
                        </g>
                    )}
                </svg>

                {/* Smart Guides Overlay */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
                    {smartGuides.map((guide, i) => (
                        <line
                            key={i}
                            x1={guide.type === 'vertical' ? guide.x : guide.x1}
                            y1={guide.type === 'vertical' ? guide.y1 : guide.y}
                            x2={guide.type === 'vertical' ? guide.x : guide.x2}
                            y2={guide.type === 'vertical' ? guide.y2 : guide.y}
                            stroke="#ec4899"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    ))}

                    {/* Selection Rectangle */}
                    {selectionRect && (
                        <rect
                            x={selectionRect.x}
                            y={selectionRect.y}
                            width={selectionRect.width}
                            height={selectionRect.height}
                            fill="rgba(99, 102, 241, 0.1)"
                            stroke="#6366f1"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            pointerEvents="none"
                        />
                    )}
                </svg>

                {/* Artboard Controls */}
                {tool === 'artboard' && (
                    <>
                        {/* Drag handle to move artboard */}
                        <div
                            style={{
                                position: 'absolute',
                                top: -30,
                                left: 0,
                                background: '#10b981',
                                color: 'white',
                                padding: '4px 12px',
                                fontSize: '11px',
                                cursor: 'move',
                                borderRadius: '4px 4px 0 0',
                                userSelect: 'none'
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsDraggingArtboard(true);
                                const coords = getCanvasCoords(e);
                                setDragStart(coords);
                            }}
                        >
                            📐 Artboard: {Math.round(canvasSize.width)} x {Math.round(canvasSize.height)}
                        </div>

                        {/* Resize handles */}
                        <div style={{ position: 'absolute', right: -5, top: '50%', width: 10, height: 10, background: '#10b981', cursor: 'ew-resize', pointerEvents: 'auto', borderRadius: '50%' }} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
                        <div style={{ position: 'absolute', bottom: -5, left: '50%', width: 10, height: 10, background: '#10b981', cursor: 'ns-resize', pointerEvents: 'auto', borderRadius: '50%' }} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
                        <div style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: '#10b981', cursor: 'nwse-resize', pointerEvents: 'auto', borderRadius: '50%' }} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
                    </>
                )}

                {/* Clip Path Definitions for Glass Effect on Custom Paths */}
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        {shapes.filter(s => s.glassEffect && s.type === 'path' && s.pathData).map(shape => (
                            <clipPath key={`clip-${shape.id}`} id={`glass-clip-${shape.id}`} clipPathUnits="objectBoundingBox">
                                <path
                                    d={shape.pathData}
                                    transform={`scale(${1 / (shape.width || 1)} ${1 / (shape.height || 1)})`}
                                />
                            </clipPath>
                        ))}
                    </defs>
                </svg>

                {/* Glass Effect Overlay - CSS backdrop-filter for true glassmorphism */}
                {shapes.filter(s => s.glassEffect).map(shape => {
                    const glassBlur = shape.glassBlur || 10;
                    const glassOpacity = shape.glassOpacity || 0.3;
                    const rotation = shape.rotation || 0;
                    const isSelected = selection.includes(shape.id);

                    // Calculate corner radius for different shape types
                    let borderRadius = '0px';
                    let clipPath = null;

                    if (shape.type === 'rect') {
                        if (shape.cornerRadius) {
                            borderRadius = `${shape.cornerRadius}px`;
                        } else if (shape.cornerRadiusTL || shape.cornerRadiusTR || shape.cornerRadiusBR || shape.cornerRadiusBL) {
                            borderRadius = `${shape.cornerRadiusTL || 0}px ${shape.cornerRadiusTR || 0}px ${shape.cornerRadiusBR || 0}px ${shape.cornerRadiusBL || 0}px`;
                        }
                    } else if (shape.type === 'ellipse') {
                        borderRadius = '50%';
                    } else if (shape.type === 'path' && shape.pathData) {
                        // Use SVG clip-path for custom paths
                        clipPath = `url(#glass-clip-${shape.id})`;
                    }

                    return (
                        <div
                            key={`glass-${shape.id}`}
                            style={{
                                position: 'absolute',
                                left: shape.x,
                                top: shape.y,
                                width: shape.width,
                                height: shape.height,
                                transform: `rotate(${rotation}deg) scale(${shape.scaleX || 1}, ${shape.scaleY || 1})`,
                                transformOrigin: 'center center',
                                backdropFilter: `blur(${glassBlur}px)`,
                                WebkitBackdropFilter: `blur(${glassBlur}px)`,
                                backgroundColor: shape.fill ? `${shape.fill}${Math.round(glassOpacity * 255).toString(16).padStart(2, '0')}` : `rgba(255, 255, 255, ${glassOpacity})`,
                                border: shape.stroke ? `${shape.strokeWidth || 1}px solid ${shape.stroke}` : `1px solid rgba(255, 255, 255, 0.3)`,
                                borderRadius: borderRadius,
                                clipPath: clipPath,
                                WebkitClipPath: clipPath,
                                boxShadow: isSelected ? '0 0 0 2px #6366f1' : 'none',
                                cursor: 'move',
                                transition: 'box-shadow 0.2s ease',
                                pointerEvents: 'auto'
                            }}
                            onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                            onDoubleClick={(e) => handleShapeDoubleClick(e, shape.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
window.Canvas = Canvas;
