from flask_frozen import Freezer
from app import app

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_BASE_URL'] = 'https://databoardss.github.io/databoard/'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_REMOVE_EXTRA_FILES'] = False

# Configure static file handling
app.config['FREEZER_STATIC_IGNORE'] = ['.git*', 'CNAME', '.gitignore']
app.config['FREEZER_DEFAULT_MIMETYPE'] = 'application/json'

freezer = Freezer(app)

@freezer.register_generator
def index():
    yield {}  # Generate root URL

@freezer.register_generator
def api_data():
    yield {}  # Generate API endpoint

if __name__ == '__main__':
    freezer.freeze() 