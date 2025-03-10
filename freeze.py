from flask_frozen import Freezer
from app import app

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False  # Keep existing files

freezer = Freezer(app)

@freezer.register_generator
def api_data():
    # Generate the API endpoint
    yield "/api/data"

@freezer.register_generator
def index():
    # Generate the main page
    yield "/"

if __name__ == '__main__':
    freezer.freeze() 