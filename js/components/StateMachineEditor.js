const React = window.React;
const Icons = window.Icons;

const StateMachineEditor = ({ states, transitions, onAddState, onAddTransition, onSelectNode, selectedNodeId, selectedTransitionId, onSelectTransition }) => {
    const [draggedNode, setDraggedNode] = React.useState(null);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const [connectingNode, setConnectingNode] = React.useState(null);
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

    const svgRef = React.useRef(null);

    const handleMouseDown = (e, stateId) => {
        e.stopPropagation();
        setDraggedNode(stateId);
        const state = states.find(s => s.id === stateId);
        setOffset({
            x: e.clientX - state.x,
            y: e.clientY - state.y
        });
        onSelectNode(stateId);
        onSelectTransition(null);
    };

    const handleMouseMove = (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        if (draggedNode) {
            const newState = {
                id: draggedNode,
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
            };
            onAddState(newState); // Update position
        }
    };

    const handleMouseUp = () => {
        setDraggedNode(null);
        setConnectingNode(null);
    };

    const handleConnectStart = (e, stateId) => {
        e.stopPropagation();
        setConnectingNode(stateId);
    };

    const handleConnectEnd = (e, stateId) => {
        e.stopPropagation();
        if (connectingNode && connectingNode !== stateId) {
            onAddTransition({
                from: connectingNode,
                to: stateId,
                id: Date.now(),
                condition: null
            });
        }
        setConnectingNode(null);
    };

    return (
        <div className="state-machine-editor" style={{ width: '100%', height: '100%', background: '#1e1e1e', position: 'relative', overflow: 'hidden' }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => {
                    onSelectNode(null);
                    onSelectTransition(null);
                }}
            >
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                    </marker>
                    <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
                    </marker>
                </defs>

                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Transitions */}
                {transitions.map(t => {
                    const fromState = states.find(s => s.id === t.from);
                    const toState = states.find(s => s.id === t.to);
                    if (!fromState || !toState) return null;

                    const isSelected = selectedTransitionId === t.id;

                    return (
                        <g key={t.id} onClick={(e) => { e.stopPropagation(); onSelectTransition(t.id); onSelectNode(null); }}>
                            <line
                                x1={fromState.x + 60}
                                y1={fromState.y + 20}
                                x2={toState.x + 60}
                                y2={toState.y + 20}
                                stroke={isSelected ? "var(--accent)" : "#666"}
                                strokeWidth={isSelected ? "3" : "2"}
                                markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                                style={{ cursor: 'pointer' }}
                            />
                            {/* Hit area for easier selection */}
                            <line
                                x1={fromState.x + 60}
                                y1={fromState.y + 20}
                                x2={toState.x + 60}
                                y2={toState.y + 20}
                                stroke="transparent"
                                strokeWidth="10"
                                style={{ cursor: 'pointer' }}
                            />
                        </g>
                    );
                })}

                {/* Connection Line */}
                {connectingNode && (
                    <line
                        x1={states.find(s => s.id === connectingNode).x + 60}
                        y1={states.find(s => s.id === connectingNode).y + 20}
                        x2={mousePos.x}
                        y2={mousePos.y}
                        stroke="#666"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                )}

                {/* States */}
                {states.map(state => {
                    const isSelected = selectedNodeId === state.id;
                    return (
                        <g
                            key={state.id}
                            transform={`translate(${state.x}, ${state.y})`}
                            onMouseDown={(e) => handleMouseDown(e, state.id)}
                            onMouseUp={(e) => handleConnectEnd(e, state.id)}
                            style={{ cursor: 'move' }}
                        >
                            <rect
                                width="120"
                                height="40"
                                rx="4"
                                fill={state.name === 'Entry' ? '#4ade80' : state.name === 'Exit' ? '#f87171' : '#3b82f6'}
                                stroke={isSelected ? '#fff' : 'transparent'}
                                strokeWidth={isSelected ? 2 : 0}
                                fillOpacity="0.8"
                            />
                            <text x="60" y="25" textAnchor="middle" fill="#fff" fontSize="12" pointerEvents="none" style={{ userSelect: 'none' }}>
                                {state.name}
                            </text>

                            <circle
                                cx="120"
                                cy="20"
                                r="6"
                                fill="#fff"
                                stroke="#333"
                                onMouseDown={(e) => handleConnectStart(e, state.id)}
                                style={{ cursor: 'crosshair' }}
                            />
                        </g>
                    );
                })}
            </svg>

            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => onAddState({ id: Date.now(), name: 'New State', x: 100, y: 100 })}>
                    <Icons.Plus size={14} /> Add State
                </button>
            </div>
        </div>
    );
};

window.StateMachineEditor = StateMachineEditor;
