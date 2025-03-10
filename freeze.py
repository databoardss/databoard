from flask_frozen import Freezer
from app import app

# Configure Freezer for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_BASE_URL'] = 'https://databoardss.github.io/databoard/'
app.config['FREEZER_RELATIVE_URLS'] = True

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