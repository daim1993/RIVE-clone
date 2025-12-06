const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    {type !== 'alert' && (
                        <button className="btn" onClick={onCancel} style={{ padding: '6px 12px', border: '1px solid var(--border-color)' }}>
                            Cancel
                        </button>
                    )}
                    <button className="btn primary" onClick={onConfirm} style={{ padding: '6px 12px' }}>
                        {type === 'alert' ? 'OK' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

window.Modal = Modal;
