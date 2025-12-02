const Icons = window.Icons;

const StateMachine = ({
    animations,
    transitions,
    activeAnimationId,
    setActiveAnimationId,
    onNodeMouseDown,
    inputs,
    setInputs,
    addTransition,
    deleteTransition
}) => {
    // Calculate SVG paths for transitions
    const getConnectorPath = (start, end) => {
        const startX = start.x + 150; // Right side of start node
        const startY = start.y + 40;  // Middle of start node
        const endX = end.x;           // Left side of end node
        const endY = end.y + 40;      // Middle of end node

        const controlPoint1X = startX + 50;
        const controlPoint1Y = startY;
        const controlPoint2X = endX - 50;
        const controlPoint2Y = endY;

        return `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    };

    const entryNode = { x: 50, y: 100, name: 'Entry', id: 'Entry' };

    return (
        <div className="state-machine-editor" style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-app)',
            userSelect: 'none'
        }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                    </marker>
                </defs>
                {transitions.map(trans => {
                    const fromNode = trans.from === 'Entry' ? entryNode : animations.find(a => a.id === trans.from);
                    const toNode = animations.find(a => a.id === trans.to);

                    if (!fromNode || !toNode) return null;

                    return (
                        <g key={trans.id}>
                            <path
                                d={getConnectorPath(fromNode, toNode)}
                                stroke="#666"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                            {/* Label for condition */}
                            <text
                                x={(fromNode.x + toNode.x + 150) / 2}
                                y={(fromNode.y + toNode.y + 80) / 2}
                                fill="var(--text-secondary)"
                                fontSize="10"
                                textAnchor="middle"
                                style={{ background: 'var(--bg-panel)' }}
                            >
                                {trans.condition}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Entry Node */}
            <div
                className="state-node entry"
                style={{
                    position: 'absolute',
                    left: entryNode.x,
                    top: entryNode.y,
                    width: '100px',
                    height: '40px',
                    background: 'var(--accent)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                Entry
            </div>

            {/* Animation Nodes */}
            {animations.map(anim => (
                <div
                    key={anim.id}
                    className={`state-node ${activeAnimationId === anim.id ? 'active' : ''}`}
                    style={{
                        position: 'absolute',
                        left: anim.x || 200,
                        top: anim.y || 100,
                        width: '150px',
                        height: '80px',
                        background: activeAnimationId === anim.id ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
                        border: `2px solid ${activeAnimationId === anim.id ? 'var(--accent)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => onNodeMouseDown(e, anim.id)}
                    onClick={() => setActiveAnimationId(anim.id)}
                >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{anim.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {(anim.duration / 1000).toFixed(1)}s
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                        {anim.keyframes.length} keys
                    </div>
                </div>
            ))}

            {/* Inputs Panel (Overlay) */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '200px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Inputs</div>
                {inputs.map(input => (
                    <div key={input.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{input.name}</span>
                        {input.type === 'boolean' ? (
                            <input
                                type="checkbox"
                                checked={input.value}
                                onChange={(e) => {
                                    const newInputs = inputs.map(i => i.id === input.id ? { ...i, value: e.target.checked } : i);
                                    setInputs(newInputs);
                                }}
                            />
                        ) : (
                            <input
                                type="number"
                                value={input.value}
                                onChange={(e) => {
                                    const newInputs = inputs.map(i => i.id === input.id ? { ...i, value: Number(e.target.value) } : i);
                                    setInputs(newInputs);
                                }}
                                style={{ width: '40px', fontSize: '11px', padding: '2px' }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

window.StateMachine = StateMachine;
