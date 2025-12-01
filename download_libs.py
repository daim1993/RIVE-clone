import urllib.request
import os

libs = [
    ("https://unpkg.com/react@18/umd/react.development.js", "js/lib/react.development.js"),
    ("https://unpkg.com/react-dom@18/umd/react-dom.development.js", "js/lib/react-dom.development.js"),
    ("https://unpkg.com/@babel/standalone/babel.min.js", "js/lib/babel.min.js")
]

for url, path in libs:
    print(f"Downloading {url} to {path}...")
    try:
        with urllib.request.urlopen(url) as response, open(path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print("Success.")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
