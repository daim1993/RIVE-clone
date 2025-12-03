const React = window.React;
const MenuBar = ({ onNew, onOpen, onExport, onUndo, onRedo, canvasSize, setCanvasSize }) => {
    const [activeMenu, setActiveMenu] = React.useState(null);

    const menus = {
        File: [
            { label: 'New', action: onNew || (() => console.log('New')) },
            { label: 'Open', action: onOpen || (() => console.log('Open')) },
            { label: 'Export JSON', action: onExport },
        ],
        Edit: [
            { label: 'Undo (Ctrl+Z)', action: onUndo },
            { label: 'Redo (Ctrl+Shift+Z)', action: onRedo },
            { label: 'Cut', action: () => console.log('Cut') },
            { label: 'Copy', action: () => console.log('Copy') },
            { label: 'Paste', action: () => console.log('Paste') },
        ],
        View: [
            { label: 'Zoom In', action: () => console.log('Zoom In') },
            { label: 'Zoom Out', action: () => console.log('Zoom Out') },
            { label: 'Fit to Screen', action: () => console.log('Fit') },
        ],
        Artboard: [
            { label: 'Resize to 1920x1080', action: () => setCanvasSize({ width: 1920, height: 1080 }) },
            { label: 'Resize to 1280x720', action: () => setCanvasSize({ width: 1280, height: 720 }) },
            { label: 'Resize to 800x600', action: () => setCanvasSize({ width: 800, height: 600 }) },
            {
                label: 'Custom Size...', action: () => {
                    const w = prompt('Width:', canvasSize.width);
                    const h = prompt('Height:', canvasSize.height);
                    if (w && h) setCanvasSize({ width: Number(w), height: Number(h) });
                }
            },
        ]
    };

    return (
        <div className="menu-bar" style={{
            height: '30px',
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: '12px',
            userSelect: 'none'
        }}>
            {Object.keys(menus).map(menuName => (
                <div
                    key={menuName}
                    style={{
                        padding: '0 12px',
                        cursor: 'pointer',
                        position: 'relative',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        background: activeMenu === menuName ? 'var(--selection)' : 'transparent'
                    }}
                    onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                >
                    {menuName}
                    {activeMenu === menuName && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            minWidth: '150px',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                            {menus[menuName].map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        hover: { background: 'var(--bg-app)' }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.action();
                                        setActiveMenu(null);
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'var(--bg-app)'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {activeMenu && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setActiveMenu(null)}
                />
            )}
        </div>
    );
};
window.MenuBar = MenuBar;
