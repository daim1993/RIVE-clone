import os

def update_file():
    base_path = r"c:\Users\daim1\Desktop\Coding\RIVE-clone"
    file_path = os.path.join(base_path, "rive_standalone.html")
    properties_path = os.path.join(base_path, "js", "components", "Properties.js")
    canvas_path = os.path.join(base_path, "js", "components", "Canvas.js")

    print(f"Reading {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"Reading {properties_path}...")
    with open(properties_path, "r", encoding="utf-8") as f:
        properties_code = f.read()

    print(f"Reading {canvas_path}...")
    with open(canvas_path, "r", encoding="utf-8") as f:
        canvas_code = f.read()

    # Process Properties code
    # Remove imports (first 3 lines)
    properties_lines = properties_code.splitlines()
    # Find the line starting with "const Properties"
    prop_start_line = 0
    for i, line in enumerate(properties_lines):
        if line.strip().startswith("const Properties ="):
            prop_start_line = i
            break
    
    properties_content = "\n".join(properties_lines[prop_start_line:])
    
    # Process Canvas code
    canvas_lines = canvas_code.splitlines()
    canvas_start_line = 0
    for i, line in enumerate(canvas_lines):
        if line.strip().startswith("const Canvas ="):
            canvas_start_line = i
            break
    canvas_content = "\n".join(canvas_lines[canvas_start_line:])
    
    # 1. Fix CSS
    # We look for the specific block
    css_search = "width: 12px;"
    css_context_start = ".input-group label {"
    
    # Find the block
    idx = content.find(css_context_start)
    if idx != -1:
        # Find the closing brace
        close_idx = content.find("}", idx)
        if close_idx != -1:
            block = content[idx:close_idx+1]
            if "width: 12px;" in block:
                new_block = block.replace("width: 12px;", "/* width: 12px; Removed to prevent overlap */")
                content = content[:idx] + new_block + content[close_idx+1:]
                print("CSS updated.")
            else:
                print("CSS width: 12px not found in block.")
        else:
            print("CSS block end not found.")
    else:
        print("CSS block start not found.")
    
    # 2. Add Icons
    icons_target = """    DistributeVertical: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h20" /><path d="M2 16h20" /><rect width="14" height="6" x="5" y="4" rx="1" /><rect width="14" height="6" x="5" y="14" rx="1" /></svg>
};"""
    icons_replacement = """    DistributeVertical: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h20" /><path d="M2 16h20" /><rect width="14" height="6" x="5" y="4" rx="1" /><rect width="14" height="6" x="5" y="14" rx="1" /></svg>,
    Link: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    Corners: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>
};"""
    
    # Normalize line endings for search
    content_normalized = content.replace("\r\n", "\n")
    icons_target_normalized = icons_target.replace("\r\n", "\n")
    
    if icons_target_normalized in content_normalized:
        content = content_normalized.replace(icons_target_normalized, icons_replacement)
        print("Icons updated.")
    else:
        print("Icons target not found! Trying fuzzy match...")
        # Try to find just the DistributeVertical line
        dist_vert_line = 'DistributeVertical: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h20" /><path d="M2 16h20" /><rect width="14" height="6" x="5" y="4" rx="1" /><rect width="14" height="6" x="5" y="14" rx="1" /></svg>'
        if dist_vert_line in content:
             # Find the closing brace after this
             idx = content.find(dist_vert_line)
             close_brace_idx = content.find("};", idx)
             if close_brace_idx != -1:
                 # Check if Link is already there
                 if "Link:" not in content[idx:close_brace_idx]:
                     replacement = dist_vert_line + ",\n" + """    Link: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    Corners: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>"""
                     content = content[:idx] + replacement + content[idx+len(dist_vert_line):]
                     print("Icons updated (fuzzy).")
                 else:
                     print("Icons already present.")

    # 3. Replace Properties Component
    start_marker = "const Properties = ({ selection, shapes, updateShape, updateShapes, canvasSize }) => {"
    end_marker = "const Timeline = ({"
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        print(f"Replacing Properties component (indices {start_idx} to {end_idx})...")
        new_properties_block = properties_content + "\n\n\n"
        content = content[:start_idx] + new_properties_block + content[end_idx:]
    else:
        print("Properties component not found!")

    # 4. Replace Canvas Component
    start_marker_canvas = "const Canvas = ({ shapes, selection, setSelection, tool, addShape, updateShape, onUpdateEnd, canvasSize, compact = false, setCanvasSize }) => {"
    end_marker_canvas = "const { useState, useEffect, useRef } = React;"
    
    start_idx_canvas = content.find(start_marker_canvas)
    end_idx_canvas = content.find(end_marker_canvas)
    
    if start_idx_canvas != -1 and end_idx_canvas != -1:
        print(f"Replacing Canvas component (indices {start_idx_canvas} to {end_idx_canvas})...")
        new_canvas_block = canvas_content + "\n\n\n"
        content = content[:start_idx_canvas] + new_canvas_block + content[end_idx_canvas:]
    else:
        print("Canvas component not found!")

    print(f"Writing back to {file_path}...")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully updated rive_standalone.html")

if __name__ == "__main__":
    update_file()
