const { useState, useEffect, useRef, useCallback } = React;

const Resizer = ({ direction, onResizeStart, onResize, onResizeEnd }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handlersRef = useRef({});

    useEffect(() => {
        return () => {
            if (handlersRef.current.handleMouseMove) {
                document.removeEventListener('mousemove', handlersRef.current.handleMouseMove);
            }
            if (handlersRef.current.handleMouseUp) {
                document.removeEventListener('mouseup', handlersRef.current.handleMouseUp);
            }
            document.body.style.cursor = 'default';
        };
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const startX = e.clientX;
        const startY = e.clientY;

        if (onResizeStart) onResizeStart();

        const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            onResize(deltaX, deltaY);
        };

        const handleMouseUp = (upEvent) => {
            upEvent.preventDefault();
            upEvent.stopPropagation();
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            handlersRef.current = {};
            if (onResizeEnd) onResizeEnd();
        };

        handlersRef.current = { handleMouseMove, handleMouseUp };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = direction === 'row' ? 'col-resize' : 'row-resize';
    };

    return (
        <div
            className={`layout-resizer ${direction} ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
        />
    );
};

const LayoutContainer = ({ node, onResize, componentMap }) => {
    const containerRef = useRef(null);
    const dragStartValues = useRef(null);

    const handleResizeStart = (index) => {
        if (!containerRef.current) return;
        // Capture initial sizes
        dragStartValues.current = {
            child1Size: node.children[index].size,
            child2Size: node.children[index + 1].size,
            containerSize: node.direction === 'row'
                ? containerRef.current.offsetWidth
                : containerRef.current.offsetHeight
        };
    };

    const handleResize = (deltaX, deltaY, index) => {
        if (!dragStartValues.current) return;

        const { child1Size, child2Size, containerSize } = dragStartValues.current;
        const deltaPixels = node.direction === 'row' ? deltaX : deltaY;
        const deltaPercent = (deltaPixels / containerSize) * 100;

        const newSize1 = child1Size + deltaPercent;
        const newSize2 = child2Size - deltaPercent;

        // Min size check (e.g. 5%)
        if (newSize1 < 5 || newSize2 < 5) return;

        onResize(node.id, index, newSize1, newSize2);
    };

    const handleResizeEnd = () => {
        dragStartValues.current = null;
    };

    return (
        <div ref={containerRef} className={`layout-container ${node.direction}`} style={{ flex: node.size }}>
            {node.children.map((child, index) => (
                <React.Fragment key={child.id || index}>
                    <LayoutNode
                        node={child}
                        onResize={onResize}
                        componentMap={componentMap}
                    />
                    {index < node.children.length - 1 && (
                        <Resizer
                            direction={node.direction}
                            onResizeStart={() => handleResizeStart(index)}
                            onResize={(dx, dy) => handleResize(dx, dy, index)}
                            onResizeEnd={handleResizeEnd}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const LayoutNode = ({ node, onResize, componentMap }) => {
    if (node.type === 'component') {
        const Component = componentMap[node.component];
        return (
            <div className="layout-panel" style={{ flex: node.size }}>
                {Component ? <Component {...node.props} /> : <div>Component {node.component} not found</div>}
            </div>
        );
    }

    if (node.type === 'container') {
        return (
            <LayoutContainer
                node={node}
                onResize={onResize}
                componentMap={componentMap}
            />
        );
    }

    return null;
};

const Layout = ({ layout, componentMap, onLayoutChange }) => {
    const [layoutState, setLayoutState] = useState(layout);

    useEffect(() => {
        setLayoutState(layout);
    }, [layout]);

    const handleResize = (containerId, childIndex, newSize1, newSize2) => {
        const updateNode = (node) => {
            if (node.id === containerId) {
                const newChildren = [...node.children];
                newChildren[childIndex] = { ...newChildren[childIndex], size: newSize1 };
                newChildren[childIndex + 1] = { ...newChildren[childIndex + 1], size: newSize2 };
                return { ...node, children: newChildren };
            }

            if (node.children) {
                return {
                    ...node,
                    children: node.children.map(updateNode)
                };
            }

            return node;
        };

        const updatedLayout = updateNode(layoutState);
        setLayoutState(updatedLayout);

        if (onLayoutChange) {
            onLayoutChange(updatedLayout);
        }
    };

    return (
        <div className="layout-root">
            <LayoutNode node={layoutState} onResize={handleResize} componentMap={componentMap} />
        </div>
    );
};

window.Layout = Layout;
