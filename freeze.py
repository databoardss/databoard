from flask_frozen import Freezer
from app import app
import os

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_BASE_URL'] = 'https://databoardss.github.io/databoard/'
app.config['FREEZER_RELATIVE_URLS'] = True  # Use relative URLs for GitHub Pages
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False
app.config['FREEZER_DEFAULT_MIMETYPE'] = 'text/html'  # Default to HTML for index

# Ensure static files are copied
app.config['FREEZER_STATIC_IGNORE'] = []
app.config['FREEZER_DESTINATION_IGNORE'] = ['.git*', 'CNAME', '.gitignore']

freezer = Freezer(app)

@freezer.register_generator
def index():
    # Generate the main page
    yield {'path': '/'}

@freezer.register_generator
def api_data():
    # Generate the API endpoint
    yield {'path': '/api/data'}

if __name__ == '__main__':
    # Create build directory if it doesn't exist
    if not os.path.exists('build'):
        os.makedirs('build')
    
    # Freeze the application
    freezer.freeze()
    
    # Ensure index.html exists in root
    if os.path.exists('build/index/index.html'):
        os.rename('build/index/index.html', 'build/index.html')
    elif not os.path.exists('build/index.html'):
        print("Warning: index.html not generated in expected location") 