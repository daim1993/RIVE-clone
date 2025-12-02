const Icons = window.Icons;
const Hierarchy = ({ shapes, selection, setSelection, onReparent, onMoveShape, onAddGroup }) => {
    const [draggedId, setDraggedId] = React.useState(null);
    const [expanded, setExpanded] = React.useState({}); // Map of id -> boolean
    const [dropTarget, setDropTarget] = React.useState(null); // { id, position: 'before' | 'after' | 'inside' }

    // Initialize expanded state for new items (default expanded)
    React.useEffect(() => {
        const newExpanded = { ...expanded };
        let changed = false;
        shapes.forEach(s => {
            if (s.children && s.children.length > 0 && expanded[s.id] === undefined) {
                newExpanded[s.id] = true;
                changed = true;
            }
        });
        if (changed) setExpanded(newExpanded);
    }, [shapes]);

    const toggleExpand = (e, id) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Build tree structure
    const buildTree = (items) => {
        const itemMap = {};
        const roots = [];

        // Initialize map
        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        // Build hierarchy
        items.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                roots.push(itemMap[item.id]);
            }
        });

        // Sort children by index in original array (which is render order)
        // But we want to display in REVERSE order (Front on Top)
        // So we reverse the arrays
        const reverseChildren = (nodes) => {
            nodes.reverse();
            nodes.forEach(node => {
                if (node.children.length > 0) {
                    reverseChildren(node.children);
                }
            });
            return nodes;
        };

        return reverseChildren(roots);
    };

    const tree = buildTree(shapes);

    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, targetId, hasChildren, isExpanded) => {
        e.preventDefault();
        e.stopPropagation();

        if (!targetId) return; // Ignore drag over container for now, or handle separately

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        // Thresholds for before/inside/after
        // If it's a group and expanded, we might want to drop inside more easily?
        // Simple logic: Top 25% = Before, Bottom 25% = After, Middle 50% = Inside (if group)

        let position = 'inside';

        if (hasChildren || e.currentTarget.classList.contains('group-item')) {
            if (y < height * 0.25) position = 'before';
            else if (y > height * 0.75) position = 'after';
            else position = 'inside';
        } else {
            // For leaf nodes, split 50/50
            if (y < height * 0.5) position = 'before';
            else position = 'after';
        }

        // If dragging over itself or parent/child invalid logic, maybe handle visual feedback differently?
        // For now just set state
        setDropTarget({ id: targetId, position });
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = (e) => {
        // setDropTarget(null); // This flickers too much, need better logic or just clear on drop
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedId = parseInt(e.dataTransfer.getData('text/plain'));

        if (droppedId === targetId) {
            setDropTarget(null);
            setDraggedId(null);
            return;
        }

        if (onMoveShape && dropTarget) {
            onMoveShape(droppedId, dropTarget.id, dropTarget.position);
        } else if (onReparent && !dropTarget) {
            // Fallback or root drop
            // If dropped on empty space, maybe move to top level?
            // onMoveShape(droppedId, null, 'after'); // Implementation detail
        }

        setDropTarget(null);
        setDraggedId(null);
    };

    const handleSelect = (e, id) => {
        e.stopPropagation();

        let newSelection = [...selection];
        if (e.shiftKey) {
            // Range select (simplified: just add to selection for now)
            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(i => i !== id);
            } else {
                newSelection.push(id);
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle
            if (newSelection.includes(id)) {
                newSelection = newSelection.filter(i => i !== id);
            } else {
                newSelection.push(id);
            }
        } else {
            // Single select
            newSelection = [id];
        }
        setSelection(newSelection);
    };

    const renderTreeItem = (item, depth = 0) => {
        const isSelected = selection.includes(item.id);
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded[item.id];
        const isDragged = draggedId === item.id;

        const isDropTarget = dropTarget && dropTarget.id === item.id;
        const dropPosition = isDropTarget ? dropTarget.position : null;

        const itemStyle = {
            borderTop: dropPosition === 'before' ? '2px solid var(--accent)' : '2px solid transparent',
            borderBottom: dropPosition === 'after' ? '2px solid var(--accent)' : '2px solid transparent',
            background: dropPosition === 'inside' ? 'rgba(99, 102, 241, 0.2)' : (isSelected ? 'var(--selection)' : 'transparent'),
            opacity: isDragged ? 0.5 : 1
        };

        return (
            <div key={item.id} className="tree-node">
                <div
                    className={`tree-item ${isSelected ? 'selected' : ''} ${isDragged ? 'dragged' : ''} ${item.type === 'group' ? 'group-item' : ''}`}
                    onClick={(e) => handleSelect(e, item.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, item.id, item.type === 'group', isExpanded)}
                    onDrop={(e) => handleDrop(e, item.id)}
                    style={itemStyle}
                >
                    {/* Indentation and Toggle */}
                    <div className="tree-item-content" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', paddingLeft: depth * 12 }}>

                        {/* Toggle Arrow */}
                        <div
                            className="tree-toggle"
                            onClick={(e) => {
                                if (hasChildren || item.type === 'group') toggleExpand(e, item.id);
                            }}
                            style={{
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: (hasChildren || item.type === 'group') ? 1 : 0
                            }}
                        >
                            {(hasChildren || item.type === 'group') && (isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />)}
                        </div>

                        {/* Icon */}
                        <div className="tree-icon" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                            {item.type === 'rect' ? <Icons.Square /> :
                                item.type === 'ellipse' ? <Icons.Circle /> :
                                    item.type === 'image' ? <Icons.Image /> :
                                        item.type === 'group' ? <Icons.Group /> : <Icons.Pen />}
                        </div>

                        {/* Name */}
                        <span className="tree-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                        </span>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="tree-children">
                        {item.children.map(child => renderTreeItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="panel left-panel">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Hierarchy</span>
                <button
                    className="btn-icon"
                    onClick={onAddGroup}
                    title="Add Group/Null"
                    style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                    <Icons.Group />
                </button>
            </div>
            <div
                className="panel-content"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    // If dropped on empty space, move to top level (end of array = top of list)
                    const droppedId = parseInt(e.dataTransfer.getData('text/plain'));
                    if (onMoveShape) {
                        // Move to root, at the end (Top)
                        // We can simulate this by moving "after" the last root item? 
                        // Or just handle it in App.js if targetId is null.
                        // For now, let's just ignore root drop or map it to "move to top"
                    }
                }}
                style={{ padding: '8px 0', minHeight: '100px' }}
            >
                {tree.map(item => renderTreeItem(item))}
            </div>
        </div>
    );
};
window.Hierarchy = Hierarchy;
