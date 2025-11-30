const Hierarchy = ({ shapes, selection, setSelection, onReparent, onAddGroup }) => {
    const [draggedId, setDraggedId] = React.useState(null);

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
        const droppedId = parseInt(e.dataTransfer.getData('text/plain'));

        if (droppedId === targetId) return;

        // Prevent circular dependency (dropping parent into child)
        // Simple check: if target is a descendant of dropped, disallow
        // For now, we'll rely on onReparent to check validity or just basic check

        if (onReparent) {
            onReparent(droppedId, targetId);
        }
        setDraggedId(null);
    };

    const renderTreeItem = (item, depth = 0) => {
        const isSelected = selection === item.id;

        return (
            <div key={item.id}>
                <div
                    className={`tree-item ${isSelected ? 'selected' : ''}`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setSelection(item.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, item.id);
                    }}
                >
                    {item.type === 'rect' ? <Icons.Square /> :
                        item.type === 'ellipse' ? <Icons.Circle /> :
                            item.type === 'image' ? <Icons.Image /> :
                                item.type === 'group' ? <Icons.Group /> : <Icons.Pen />}
                    <span>{item.name}</span>
                </div>
                {item.children.map(child => renderTreeItem(child, depth + 1))}
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
            >
                {tree.map(item => renderTreeItem(item))}
            </div>
        </div>
    );
};
