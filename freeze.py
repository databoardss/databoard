from flask_frozen import Freezer
from app import app
import os

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False  # Keep existing files

# Ensure the API data is treated as JSON
app.config['FREEZER_DEFAULT_MIMETYPE'] = 'application/json'

freezer = Freezer(app)

@freezer.register_generator
def api_data():
    # Generate the API endpoint as a static JSON file
    yield {'endpoint': '/api/data'}

@freezer.register_generator
def index():
    # Generate the main page
    yield "/"

if __name__ == '__main__':
    freezer.freeze() 