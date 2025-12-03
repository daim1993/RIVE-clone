const { useState, useEffect, useRef } = React;

const App = () => {
    const [shapes, setShapes] = useState([
        { id: 1, type: 'rect', x: 100, y: 100, width: 100, height: 100, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Rectangle 1' },
        { id: 2, type: 'ellipse', x: 300, y: 200, width: 100, height: 100, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2, opacity: 1, blendMode: 'normal', name: 'Circle 1' }
    ]);
