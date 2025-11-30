const Properties = ({ selection, shapes, updateShape }) => {
    const selectedShape = shapes.find(s => s.id === selection);

    if (!selectedShape) {
        return (
            <div className="panel right-panel">
                <div className="panel-header">Properties</div>
                <div className="panel-content" style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                    No selection
                </div>
            </div>
        );
    }

    const handleChange = (field, value) => {
        updateShape(selection, { [field]: value });
    };

    return (
        <div className="panel right-panel">
            <div className="panel-header">Properties</div>
            <div className="panel-content">
                <div className="property-group">
                    <span className="property-label">Transform</span>
                    <div className="property-row">
                        <div className="input-group">
                            <label>X</label>
                            <input
                                type="number"
                                value={Math.round(selectedShape.x)}
                                onChange={(e) => handleChange('x', Number(e.target.value))}
                            />
                        </div>
                        <div className="input-group">
                            <label>Y</label>
                            <input
                                type="number"
                                value={Math.round(selectedShape.y)}
                                onChange={(e) => handleChange('y', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    {selectedShape.type !== 'path' && (
                        <>
                            <div className="property-row">
                                <div className="input-group">
                                    <label>W</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.width)}
                                        onChange={(e) => handleChange('width', Number(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>H</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedShape.height)}
                                        onChange={(e) => handleChange('height', Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <div className="property-row">
                        <div className="input-group">
                            <label>R</label>
                            <input
                                type="number"
                                value={selectedShape.rotation || 0}
                                onChange={(e) => handleChange('rotation', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="property-group">
                    <span className="property-label">Style</span>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Fill</label>
                            <input
                                type="color"
                                value={selectedShape.fill || '#ffffff'}
                                onChange={(e) => handleChange('fill', e.target.value)}
                                style={{ height: '24px', padding: 0, width: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Stroke</label>
                            <input
                                type="color"
                                value={selectedShape.stroke || '#ffffff'}
                                onChange={(e) => handleChange('stroke', e.target.value)}
                                style={{ height: '24px', padding: 0, width: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label style={{ marginBottom: '4px', width: 'auto' }}>Stroke Width: {selectedShape.strokeWidth || 0}px</label>
                            <input
                                type="number"
                                value={selectedShape.strokeWidth || 0}
                                onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
                                min="0"
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-app)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label style={{ marginBottom: '4px', width: 'auto' }}>Opacity: {Math.round((selectedShape.opacity || 1) * 100)}%</label>
                            <input
                                type="range"
                                value={selectedShape.opacity || 1}
                                onChange={(e) => handleChange('opacity', Number(e.target.value))}
                                min="0"
                                max="1"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label style={{ marginBottom: '4px', width: 'auto' }}>Blend Mode</label>
                            <select
                                value={selectedShape.blendMode || 'normal'}
                                onChange={(e) => handleChange('blendMode', e.target.value)}
                                style={{
                                    background: 'var(--bg-app)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                            >
                                <option value="normal">Normal</option>
                                <option value="multiply">Multiply</option>
                                <option value="screen">Screen</option>
                                <option value="overlay">Overlay</option>
                                <option value="darken">Darken</option>
                                <option value="lighten">Lighten</option>
                                <option value="color-dodge">Color Dodge</option>
                                <option value="color-burn">Color Burn</option>
                            </select>
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label style={{ marginBottom: '4px', width: 'auto' }}>Mask</label>
                            <select
                                value={selectedShape.maskId || ''}
                                onChange={(e) => handleChange('maskId', e.target.value ? Number(e.target.value) : null)}
                                style={{
                                    background: 'var(--bg-app)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                            >
                                <option value="">None</option>
                                {shapes.filter(s => s.id !== selection).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
