import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def build_standalone():
    base_dir = os.getcwd()
    
    # CSS
    css_content = read_file(os.path.join(base_dir, 'style.css'))
    
    # JS Files in order
    js_files = [
        'js/icons.js',
        'js/components/MenuBar.js',
        'js/components/Toolbar.js',
        'js/components/Hierarchy.js',
        'js/components/Properties.js',
        'js/components/Timeline.js',
        'js/components/Canvas.js',
        'js/App.js',
        'js/main.js'
    ]
    
    js_content = ""
    for js_file in js_files:
        path = os.path.join(base_dir, js_file)
        if os.path.exists(path):
            content = read_file(path)
            # Remove any potential import/export statements if they exist (simple check)
            lines = content.split('\n')
            filtered_lines = [line for line in lines if not line.strip().startswith('import ') and not line.strip().startswith('export ')]
            js_content += "\n".join(filtered_lines) + "\n\n"
        else:
            print(f"Warning: Could not find {js_file}")

    # Fetch libraries content
    import urllib.request
    
    print("Downloading libraries...")
    try:
        react_core = urllib.request.urlopen("https://unpkg.com/react@18/umd/react.development.js").read().decode('utf-8')
        react_dom = urllib.request.urlopen("https://unpkg.com/react-dom@18/umd/react-dom.development.js").read().decode('utf-8')
        babel = urllib.request.urlopen("https://unpkg.com/@babel/standalone/babel.min.js").read().decode('utf-8')
    except Exception as e:
        print(f"Error downloading libraries: {e}")
        return

    # HTML Template
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rive Clone - Standalone</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Embedded Libraries -->
    <script>
        {react_core}
    </script>
    <script>
        {react_dom}
    </script>
    <script>
        {babel}
    </script>

    <style>
        {css_content}
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        {js_content}
    </script>
</body>
</html>"""

    with open('rive_standalone.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Successfully created rive_standalone.html with embedded libraries")

if __name__ == "__main__":
    build_standalone()
