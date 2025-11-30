const Hierarchy = ({ shapes, selection, setSelection }) => {
    return (
        <div className="panel left-panel">
            <div className="panel-header">Hierarchy</div>
            <div className="panel-content">
                {shapes.map(shape => (
                    <div
                        key={shape.id}
                        className={`tree-item ${selection === shape.id ? 'selected' : ''}`}
                        onClick={() => setSelection(shape.id)}
                    >
                        {shape.type === 'rect' ? <Icons.Square /> :
                            shape.type === 'ellipse' ? <Icons.Circle /> :
                                shape.type === 'image' ? <Icons.Image /> : <Icons.Pen />}
                        <span>{shape.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
