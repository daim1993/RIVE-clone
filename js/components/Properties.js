

const React = window.React;
const Icons = window.Icons;
const Select = window.Select;

const Properties = ({ selection, shapes, updateShape, updateShapes, canvasSize }) => {
    const selectedShapes = shapes.filter(s => selection.includes(s.id));
    const firstShape = selectedShapes[0];

    if (selectedShapes.length === 0) {
        return (
            <div className="panel right-panel">
                <div className="panel-header">Properties</div>
                <div className="panel-content" style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                    No selection
                </div>
            </div>
        );
    }

    // Helper to get common value or "" if mixed
    const getValue = (field) => {
        if (selectedShapes.length === 0) return '';
        const val = selectedShapes[0][field];
        for (let i = 1; i < selectedShapes.length; i++) {
            if (selectedShapes[i][field] !== val) return '';
        }
        return val;
    };

    const handleChange = (field, value) => {
        selectedShapes.forEach(shape => {
            updateShape(shape.id, { [field]: value });
        });
    };

    const handleAlign = (type) => {
        if (!canvasSize) return;

        // If single selection, align to artboard
        if (selectedShapes.length === 1) {
            const shape = selectedShapes[0];
            const { width, height } = canvasSize;
            const sWidth = shape.width || 0;
            const sHeight = shape.height || 0;
            let newProps = {};

            switch (type) {
                case 'left': newProps.x = 0; break;
                case 'center-h': newProps.x = (width - sWidth) / 2; break;
                case 'right': newProps.x = width - sWidth; break;
                case 'top': newProps.y = 0; break;
                case 'middle-v': newProps.y = (height - sHeight) / 2; break;
                case 'bottom': newProps.y = height - sHeight; break;
            }
            updateShape(shape.id, newProps);
        } else {
            // Align to selection bounds
            const bounds = selectedShapes.reduce((acc, s) => ({
                minX: Math.min(acc.minX, s.x),
                minY: Math.min(acc.minY, s.y),
                maxX: Math.max(acc.maxX, s.x + (s.width || 0)),
                maxY: Math.max(acc.maxY, s.y + (s.height || 0))
            }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

            const updates = [];
            selectedShapes.forEach(s => {
                let newProps = {};
                switch (type) {
                    case 'left': newProps.x = bounds.minX; break;
                    case 'center-h': newProps.x = bounds.minX + (bounds.maxX - bounds.minX) / 2 - (s.width || 0) / 2; break;
                    case 'right': newProps.x = bounds.maxX - (s.width || 0); break;
                    case 'top': newProps.y = bounds.minY; break;
                    case 'middle-v': newProps.y = bounds.minY + (bounds.maxY - bounds.minY) / 2 - (s.height || 0) / 2; break;
                    case 'bottom': newProps.y = bounds.maxY - (s.height || 0); break;
                }
                if (Object.keys(newProps).length > 0) {
                    updates.push({ id: s.id, props: newProps });
                }
            });
            if (updateShapes) updateShapes(updates);
        }
    };

    const handleDistribute = (type) => {
        if (selectedShapes.length < 3) return;

        const updates = [];
        if (type === 'horizontal') {
            // Sort by x
            const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalWidth = (last.x + (last.width || 0)) - first.x;
            const totalShapeWidth = sorted.reduce((sum, s) => sum + (s.width || 0), 0);
            const gap = (totalWidth - totalShapeWidth) / (sorted.length - 1);

            // Distribute centers? Or gaps? Usually gaps.
            // Let's distribute evenly between first and last
            const startX = first.x;
            const endX = last.x;
            const span = endX - startX;
            const step = span / (sorted.length - 1);

            sorted.forEach((s, i) => {
                if (i === 0 || i === sorted.length - 1) return; // Don't move first/last
                updates.push({ id: s.id, props: { x: startX + (step * i) } });
            });
        } else if (type === 'vertical') {
            const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const startY = first.y;
            const endY = last.y;
            const span = endY - startY;
            const step = span / (sorted.length - 1);

            sorted.forEach((s, i) => {
                if (i === 0 || i === sorted.length - 1) return;
                updates.push({ id: s.id, props: { y: startY + (step * i) } });
            });
        }
        if (updateShapes) updateShapes(updates);
    };

    return (
        <div className="panel right-panel">
            <div className="panel-header">Properties</div>
            <div className="panel-content">
                <div className="property-group">
                    <span className="property-label">Align</span>
                    <div className="property-row" style={{ justifyContent: 'space-between' }}>
                        <button className="btn" title="Align Left" onClick={() => handleAlign('left')} style={{ padding: '4px' }}><Icons.AlignStart /></button>
                        <button className="btn" title="Align Center" onClick={() => handleAlign('center-h')} style={{ padding: '4px' }}><Icons.AlignCenterH /></button>
                        <button className="btn" title="Align Right" onClick={() => handleAlign('right')} style={{ padding: '4px' }}><Icons.AlignEnd /></button>
                        <div style={{ width: '1px', background: 'var(--border-color)', height: '24px', margin: '0 4px' }}></div>
                        <button className="btn" title="Align Top" onClick={() => handleAlign('top')} style={{ padding: '4px' }}><Icons.AlignTopV /></button>
                        <button className="btn" title="Align Middle" onClick={() => handleAlign('middle-v')} style={{ padding: '4px' }}><Icons.AlignMiddleV /></button>
                        <button className="btn" title="Align Bottom" onClick={() => handleAlign('bottom')} style={{ padding: '4px' }}><Icons.AlignBottomV /></button>

                        {selectedShapes.length > 2 && (
                            <>
                                <div style={{ width: '1px', background: 'var(--border-color)', height: '24px', margin: '0 4px' }}></div>
                                <button className="btn" title="Distribute Horizontal" onClick={() => handleDistribute('horizontal')} style={{ padding: '4px' }}><Icons.DistributeHorizontal /></button>
                                <button className="btn" title="Distribute Vertical" onClick={() => handleDistribute('vertical')} style={{ padding: '4px' }}><Icons.DistributeVertical /></button>
                            </>
                        )}
                    </div>
                </div>

                <div className="property-group">
                    <span className="property-label" style={{ marginBottom: '12px', display: 'block', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>{selectedShapes.length === 1 && selectedShapes[0].type === 'rect' ? 'Rectangle Path' : 'Transform'}</span>

                    {/* Size Row */}
                    <div className="property-row" style={{ marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ width: '40px', color: 'var(--text-secondary)', fontSize: '12px' }}>Size</span>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                <label style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>W</label>
                                <input
                                    type="number"
                                    value={Math.round(getValue('width'))}
                                    onChange={(e) => handleChange('width', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }}
                                />
                            </div>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                <label style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>H</label>
                                <input
                                    type="number"
                                    value={Math.round(getValue('height'))}
                                    onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }}
                                />
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}><Icons.Link /></div>
                    </div>

                    {/* Origin Row */}
                    <div className="property-row" style={{ marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ width: '40px', color: 'var(--text-secondary)', fontSize: '12px' }}>Origin</span>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                <label style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>X</label>
                                <input
                                    type="number"
                                    value={Math.round(getValue('x'))}
                                    onChange={(e) => handleChange('x', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }}
                                />
                            </div>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                <label style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>Y</label>
                                <input
                                    type="number"
                                    value={Math.round(getValue('y'))}
                                    onChange={(e) => handleChange('y', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                <label style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>°</label>
                                <input type="number" value={Math.round(getValue('rotation') || 0)} onChange={(e) => handleChange('rotation', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }} />
                            </div>
                        </div>
                    </div>

                    {/* Corner Row (only for rects) */}
                    {selectedShapes.every(s => s.type === 'rect') && (
                        <div className="property-row" style={{ marginBottom: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
                                <span style={{ width: '40px', color: 'var(--text-secondary)', fontSize: '12px' }}>Corner</span>
                                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'transparent', border: 'none', padding: 0 }}>
                                        <div style={{ color: 'var(--text-secondary)', marginRight: '8px', display: 'flex', alignItems: 'center' }}><Icons.Corners /></div>
                                        <input
                                            type="number"
                                            value={Math.round(getValue('cornerRadius') || 0)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                handleChange('cornerRadius', val);
                                                // Set all corners to same value
                                                handleChange('cornerRadiusTL', val);
                                                handleChange('cornerRadiusTR', val);
                                                handleChange('cornerRadiusBR', val);
                                                handleChange('cornerRadiusBL', val);
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', width: '50px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}><Icons.Link /></div>
                            </div>

                            {/* Individual corners in a 2x2 grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', paddingLeft: '40px' }}>
                                {/* Top-left */}
                                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
                                        <path d="M12 12V1a1 1 0 0 0-1-1H1" />
                                    </svg>
                                    <input
                                        type="number"
                                        value={Math.round(getValue('cornerRadiusTL') ?? getValue('cornerRadius') ?? 0)}
                                        onChange={(e) => handleChange('cornerRadiusTL', parseFloat(e.target.value))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'left', width: '100%' }}
                                    />
                                </div>

                                {/* Top-right */}
                                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
                                        <path d="M0 12V1a1 1 0 0 1 1-1h10" />
                                    </svg>
                                    <input
                                        type="number"
                                        value={Math.round(getValue('cornerRadiusTR') ?? getValue('cornerRadius') ?? 0)}
                                        onChange={(e) => handleChange('cornerRadiusTR', parseFloat(e.target.value))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'left', width: '100%' }}
                                    />
                                </div>

                                {/* Bottom-left */}
                                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
                                        <path d="M12 0v11a1 1 0 0 1-1 1H1" />
                                    </svg>
                                    <input
                                        type="number"
                                        value={Math.round(getValue('cornerRadiusBL') ?? getValue('cornerRadius') ?? 0)}
                                        onChange={(e) => handleChange('cornerRadiusBL', parseFloat(e.target.value))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'left', width: '100%' }}
                                    />
                                </div>

                                {/* Bottom-right */}
                                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
                                        <path d="M0 0v11a1 1 0 0 0 1 1h10" />
                                    </svg>
                                    <input
                                        type="number"
                                        value={Math.round(getValue('cornerRadiusBR') ?? getValue('cornerRadius') ?? 0)}
                                        onChange={(e) => handleChange('cornerRadiusBR', parseFloat(e.target.value))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'left', width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="property-group">
                    <span className="property-label">Style</span>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Fill</label>
                            <input type="color" value={getValue('fill') || '#000000'} onChange={(e) => handleChange('fill', e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none' }} />
                            <input type="text" value={getValue('fill')} onChange={(e) => handleChange('fill', e.target.value)} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Stroke</label>
                            <input type="color" value={getValue('stroke') || '#000000'} onChange={(e) => handleChange('stroke', e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none' }} />
                            <input type="text" value={getValue('stroke')} onChange={(e) => handleChange('stroke', e.target.value)} style={{ marginLeft: '8px' }} />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Width</label>
                            <input type="number" value={getValue('strokeWidth')} onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value))} />
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group">
                            <label>Opacity</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((getValue('opacity') || 1) * 100)}
                                onChange={(e) => handleChange('opacity', parseFloat(e.target.value) / 100)}
                                style={{ width: '100%' }}
                            />
                            <span style={{ marginLeft: '4px', color: 'var(--text-secondary)', fontSize: '11px' }}>%</span>
                        </div>
                    </div>
                    <div className="property-row">
                        <div className="input-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label style={{ marginBottom: '4px', width: 'auto' }}>Blend Mode</label>
                            <Select
                                value={getValue('blendMode') || 'normal'}
                                onChange={(val) => handleChange('blendMode', val)}
                                options={[
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'multiply', label: 'Multiply' },
                                    { value: 'screen', label: 'Screen' },
                                    { value: 'overlay', label: 'Overlay' },
                                    { value: 'darken', label: 'Darken' },
                                    { value: 'lighten', label: 'Lighten' },
                                    { value: 'color-dodge', label: 'Color Dodge' },
                                    { value: 'color-burn', label: 'Color Burn' }
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="property-group">
                <span className="property-label">Effects</span>

                {/* Blur */}
                <div className="property-row">
                    <div className="input-group">
                        <label>Blur</label>
                        <input
                            type="number"
                            min="0"
                            value={getValue('blur') || 0}
                            onChange={(e) => handleChange('blur', parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Glass Effect Toggle */}
                <div className="property-row">
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ marginBottom: 0 }}>Glass Effect</label>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '40px',
                            height: '20px',
                            cursor: 'pointer',
                            margin: 0
                        }}>
                            <input
                                type="checkbox"
                                checked={getValue('glassEffect') || false}
                                onChange={(e) => handleChange('glassEffect', e.target.checked)}
                                style={{
                                    opacity: 0,
                                    width: 0,
                                    height: 0
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: getValue('glassEffect') ? 'var(--accent)' : 'var(--border-color)',
                                transition: '0.3s',
                                borderRadius: '20px'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '14px',
                                    width: '14px',
                                    left: getValue('glassEffect') ? '23px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: 'white',
                                    transition: '0.3s',
                                    borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Glass Effect Options */}
                {getValue('glassEffect') && (
                    <>
                        {/* Glass Blur */}
                        <div className="property-row">
                            <div className="input-group">
                                <label>Glass Blur</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={getValue('glassBlur') || 10}
                                    onChange={(e) => handleChange('glassBlur', parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Glass Opacity */}
                        <div className="property-row">
                            <div className="input-group">
                                <label>Glass Opacity</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={Math.round((getValue('glassOpacity') || 0.3) * 100)}
                                    onChange={(e) => handleChange('glassOpacity', parseFloat(e.target.value) / 100)}
                                    style={{ width: '100%' }}
                                />
                                <span style={{ marginLeft: '4px', color: 'var(--text-secondary)', fontSize: '11px' }}>%</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
window.Properties = Properties;

