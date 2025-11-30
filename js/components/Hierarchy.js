const Hierarchy = ({ shapes, selection, setSelection, onReparent, onAddGroup }) => {
    const [draggedId, setDraggedId] = React.useState(null);
    const [expanded, setExpanded] = React.useState({}); // Map of id -> boolean

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

        return roots;
    };

    const tree = buildTree(shapes);

    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedId = parseInt(e.dataTransfer.getData('text/plain'));

        if (droppedId === targetId) return;

        if (onReparent) {
            onReparent(droppedId, targetId);
        }
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

        return (
            <div key={item.id} className="tree-node">
                <div
                    className={`tree-item ${isSelected ? 'selected' : ''} ${isDragged ? 'dragged' : ''}`}
                    onClick={(e) => handleSelect(e, item.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.id)}
                >
                    {/* Indentation and Toggle */}
                    <div className="tree-item-content" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', paddingLeft: depth * 12 }}>

                        {/* Toggle Arrow */}
                        <div
                            className="tree-toggle"
                            onClick={(e) => hasChildren && toggleExpand(e, item.id)}
                            style={{
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                opacity: hasChildren ? 1 : 0
                            }}
                        >
                            {hasChildren && (isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />)}
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
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, null)} // Drop on root
                style={{ padding: '8px 0' }}
            >
                {tree.map(item => renderTreeItem(item))}
            </div>
        </div>
    );
};
