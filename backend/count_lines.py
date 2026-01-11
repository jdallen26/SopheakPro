import os

# --- Configuration ---

# Folders to exclude from the search
EXCLUDE_FOLDERS = {
    '.git',
    '.venv',
    'venv',
    'env',
    '__pycache__',
    '.idea',
    '.vscode',
    'node_modules',
    'media',
    'staticfiles',
    'static',
    'vendor',
    'http-client-plus'
    # Add any other folders you want to ignore here
}

# Specific files to exclude
EXCLUDE_FILES = {
    'db.sqlite3',
    'count_lines.py', # Exclude this script itself
    '.DS_Store',
    'package-lock.json',
}

# Only count files with these extensions (set to None to count all files)
INCLUDE_EXTENSIONS = {
    '.py',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.html',
    '.css',
    '.scss',
    '.json',
    '.md',
    '.txt',
    '.xml',
    '.yaml',
    '.yml'
}

# ---------------------

def count_lines_in_file(filepath):
    """Counts lines in a file, handling potential encoding errors."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception:
        return 0

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    total_files = 0
    total_lines = 0
    
    print(f"{'File Path':<80} | {'Lines':>10}")
    print("-" * 93)

    for root, dirs, files in os.walk(base_dir):
        # Modify dirs in-place to skip excluded folders so os.walk doesn't traverse them
        dirs[:] = [d for d in dirs if d not in EXCLUDE_FOLDERS]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            
            _, ext = os.path.splitext(file)
            if INCLUDE_EXTENSIONS and ext.lower() not in INCLUDE_EXTENSIONS:
                continue

            filepath = os.path.join(root, file)
            lines = count_lines_in_file(filepath)
            
            rel_path = os.path.relpath(filepath, base_dir)
            print(f"{rel_path:<80} | {lines:>10}")
            
            total_files += 1
            total_lines += lines

    print("-" * 93)
    print(f"Total Files: {total_files}")
    print(f"Total Lines: {total_lines}")

if __name__ == "__main__":
    main()
