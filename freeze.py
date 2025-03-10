from flask_frozen import Freezer
from app import app
import os

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_RELATIVE_URLS'] = False  # Use absolute URLs
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False
app.config['FREEZER_DEFAULT_MIMETYPE'] = 'application/json'

# Ensure static files are copied
app.config['FREEZER_STATIC_IGNORE'] = []
app.config['FREEZER_DESTINATION_IGNORE'] = ['.git*', 'CNAME', '.gitignore']

freezer = Freezer(app)

@freezer.register_generator
def index():
    # Generate the main page
    yield {}

@freezer.register_generator
def api_data():
    # Generate the API endpoint
    yield {}

if __name__ == '__main__':
    # Create build directory if it doesn't exist
    if not os.path.exists('build'):
        os.makedirs('build')
    
    # Freeze the application
    freezer.freeze() 