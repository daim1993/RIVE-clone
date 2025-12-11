const React = window.React;
const ReactDOM = window.ReactDOM;
const App = window.App;

if (!ReactDOM) {
    console.error("ReactDOM not found");
    document.body.innerHTML = '<div style="color:white; padding:20px;">Error: ReactDOM not found. Check internet connection.</div>';
} else if (!App) {
    console.error("App component not found");
    document.body.innerHTML = '<div style="color:white; padding:20px;">Error: App component not found. Check console for syntax errors in App.js.</div>';
} else {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    const ErrorBoundary = window.ErrorBoundary || (({ children }) => children);
    root.render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}
