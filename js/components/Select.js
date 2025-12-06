const React = window.React;
const { useState, useEffect, useRef } = React;

const Select = ({ value, onChange, options, style, placeholder = "Select...", className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value == value); // mild type coercion for numbers/strings

    return (
        <div
            ref={containerRef}
            className={`custom-select-container ${className || ''}`}
            style={style}
        >
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption ? selectedOption.label : (value || placeholder)}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor">
                    <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            {isOpen && (
                <div className="custom-select-options">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${option.value == value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

window.Select = Select;
