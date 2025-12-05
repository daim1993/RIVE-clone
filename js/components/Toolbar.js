const React = window.React;
const Icons = window.Icons;
const Toolbar = ({ activeTool, setTool, onImportImage, onImportSVG, onDistributeHorizontal, onDistributeVertical, selection }) => {
    const fileInputRef = React.useRef(null);
    const svgInputRef = React.useRef(null);

    const tools = [
        { id: 'select', icon: Icons.MousePointer },
        { id: 'rect', icon: Icons.Square },
        { id: 'ellipse', icon: Icons.Circle },
        { id: 'pen', icon: Icons.Pen },
        { id: 'artboard', icon: Icons.Artboard },
    ];

    const showDistribution = selection && selection.length >= 3;

    return (
        <div className="toolbar">
            {tools.map(tool => (
                <div
                    key={tool.id}
                    className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                    onClick={() => setTool(tool.id)}
                    title={tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}
                >
                    <tool.icon />
                </div>
            ))}
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
            <div
                className="tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Import Image"
            >
                <Icons.Image />
            </div>
            <div
                className="tool-btn"
                onClick={() => svgInputRef.current?.click()}
                title="Import SVG"
            >
                <Icons.Upload />
            </div>

            {/* Distribution Tools - Only show when 3+ items selected */}
            {showDistribution && (
                <>
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
                    <div
                        className="tool-btn"
                        onClick={onDistributeHorizontal}
                        title="Distribute Horizontally"
                    >
                        <Icons.DistributeHorizontal />
                    </div>
                    <div
                        className="tool-btn"
                        onClick={onDistributeVertical}
                        title="Distribute Vertically"
                    >
                        <Icons.DistributeVertical />
                    </div>
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onImportImage}
            />
            <input
                ref={svgInputRef}
                type="file"
                accept=".svg"
                style={{ display: 'none' }}
                onChange={onImportSVG}
            />
        </div>
    );
};
window.Toolbar = Toolbar;
