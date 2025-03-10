from flask_frozen import Freezer
from app import app
import os
import shutil

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False
app.config['FREEZER_DEFAULT_MIMETYPE'] = 'text/html'

# Remove the server name configuration as it's causing conflicts
app.config['SERVER_NAME'] = None

# Ensure static files are copied
app.config['FREEZER_STATIC_IGNORE'] = []
app.config['FREEZER_DESTINATION_IGNORE'] = ['.git*', 'CNAME', '.gitignore']

freezer = Freezer(app)

@freezer.register_generator
def index():
    yield {}  # Generate index.html in root

@freezer.register_generator
def api_data():
    yield {}  # Generate API endpoint

if __name__ == '__main__':
    # Clean build directory if it exists
    if os.path.exists('build'):
        shutil.rmtree('build')
    os.makedirs('build')
    
    # Copy static files and templates
    if os.path.exists('static'):
        shutil.copytree('static', 'build/static', dirs_exist_ok=True)
    if os.path.exists('templates'):
        shutil.copytree('templates', 'build/templates', dirs_exist_ok=True)
    
    # Freeze the application
    freezer.freeze()
    
    # Ensure index.html is in root of build directory
    if os.path.exists('build/index/index.html'):
        shutil.move('build/index/index.html', 'build/index.html')
        os.rmdir('build/index')
    
    print("Build completed successfully!")
    print("Contents of build directory:")
    for root, dirs, files in os.walk('build'):
        level = root.replace('build', '').count(os.sep)
        indent = ' ' * 4 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            print(f"{subindent}{f}") 