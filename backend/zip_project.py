#!/usr/bin/env python3
"""
zip_project.py

Create a zip of the project directory excluding common virtualenv, VCS and IDE files.

Usage:
    python zip_project.py -o ../SopheakWebApp.zip
"""

import os
import sys
import argparse
import fnmatch
import zipfile
from datetime import datetime

DEFAULT_EXCLUDE_NAMES = {
    '.git', '.venv', 'venv', 'env', '__pycache__', '.pytest_cache',
    'node_modules', '.idea', '.vscode', '.vs', 'staticfiles', 'dist', 'build'
}
DEFAULT_EXCLUDE_PATTERNS = {
    '*.pyc', '*.pyo', '*.sqlite3', '*.log', '*.env', '.DS_Store'
}

def should_exclude(name, relpath):
    # exclude by exact path segment
    segments = relpath.split(os.sep)
    if any(seg in DEFAULT_EXCLUDE_NAMES for seg in segments):
        return True
    # exclude by pattern match against filename
    for pat in DEFAULT_EXCLUDE_PATTERNS:
        if fnmatch.fnmatch(name, pat):
            return True
    return False

def create_zip(root_dir, out_path):
    root_dir = os.path.abspath(root_dir)
    out_path = os.path.abspath(out_path)
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            rel_dir = os.path.relpath(dirpath, root_dir)
            # prune directories we don't want to descend into
            dirnames[:] = [d for d in dirnames if not should_exclude(d, os.path.join(rel_dir, d))]
            for fname in filenames:
                rel_file = os.path.normpath(os.path.join(rel_dir, fname))
                if should_exclude(fname, rel_file):
                    continue
                full_path = os.path.join(dirpath, fname)
                arcname = rel_file if rel_file != '.' else fname
                # ensure we don't include the script output if inside repo
                if os.path.abspath(full_path) == os.path.abspath(out_path):
                    continue
                zf.write(full_path, arcname)
    return out_path

def main():
    p = argparse.ArgumentParser(description='Zip project excluding .git, .venv, etc.')
    p.add_argument('-r', '--root', default='.', help='Project root directory (default: current dir)')
    p.add_argument('-o', '--output', default=None, help='Output zip path (default: projectname_TIMESTAMP.zip in parent folder)')
    args = p.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print('Root directory does not exist:', root, file=sys.stderr)
        sys.exit(1)

    if args.output:
        out = args.output
    else:
        base = os.path.basename(os.path.abspath(root)) or 'project'
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        out = os.path.join(os.path.dirname(root), f'{base}_{ts}.zip')

    out = os.path.abspath(out)
    # create parent dir if needed
    os.makedirs(os.path.dirname(out), exist_ok=True)

    print('Zipping', root, '->', out)
    zip_path = create_zip(root, out)
    print('Done:', zip_path)

if __name__ == '__main__':
    main()