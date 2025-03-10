from flask import Flask, render_template, jsonify, url_for
import pandas as pd
from datetime import datetime
import logging
import socket
import atexit
import signal
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure app for GitHub Pages
app.config['APPLICATION_ROOT'] = '/databoard'
app.config['PREFERRED_URL_SCHEME'] = 'https'
app.config['SERVER_NAME'] = 'databoardss.github.io' if os.environ.get('GITHUB_ACTIONS') else None

# Load and process the data
logger.info("\n=== Loading and Processing Data ===")
logger.info("Loading CSV file...")
df = pd.read_csv('housing_data.csv')
logger.info(f"CSV loaded. Shape: {df.shape}")

# Convert sale_date to datetime and ensure proper ISO format
logger.info("\n=== Processing Dates ===")
logger.info("Original date format sample:")
logger.info(df['sale_date'].head())

df['sale_date'] = pd.to_datetime(df['sale_date'])
date_range = (df['sale_date'].min(), df['sale_date'].max())
logger.info(f"Date range: {date_range[0]} to {date_range[1]}")

# Convert to ISO format string
df['sale_date'] = df['sale_date'].dt.strftime('%Y-%m-%d')
logger.info("Processed date format sample:")
logger.info(df['sale_date'].head())

# Convert numeric columns to proper types
logger.info("\n=== Converting Data Types ===")
df['price'] = df['price'].astype(float)
df['num_rooms'] = df['num_rooms'].astype(int)
df['num_bathrooms'] = df['num_bathrooms'].astype(int)
df['square_footage'] = df['square_footage'].astype(int)
df['lot_size'] = df['lot_size'].astype(int)
df['year_built'] = df['year_built'].astype(int)
df['days_on_market'] = df['days_on_market'].astype(int)
df['garage'] = df['garage'].astype(bool)
df['pool'] = df['pool'].astype(bool)

logger.info("Data types after conversion:")
logger.info(df.dtypes)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    logger.info("\n=== API Request Received ===")
    
    # Get total number of properties
    total_properties = len(df)
    logger.info(f"Total properties: {total_properties}")
    
    # Create a list of records for the aggregated data
    records = []
    unique_neighborhoods = df['neighborhood'].unique()
    logger.info(f"\nUnique neighborhoods: {unique_neighborhoods}")
    
    for neighborhood in unique_neighborhoods:
        neighborhood_data = df[df['neighborhood'] == neighborhood]
        avg_price = neighborhood_data['price'].mean()
        locations = neighborhood_data['location'].value_counts().to_dict()
        
        # Add a record for each location in this neighborhood
        for location, count in locations.items():
            records.append({
                'neighborhood': neighborhood,
                'location': location,
                'price': avg_price,
                'count': count
            })
    
    logger.info(f"\nNumber of aggregated records: {len(records)}")
    if records:
        logger.info(f"Sample record: {records[0]}")
    
    # Prepare complete raw data for the table
    raw_data = df.to_dict('records')
    logger.info(f"\nNumber of raw records: {len(raw_data)}")
    if raw_data:
        logger.info(f"Sample raw record: {raw_data[0]}")
    
    response_data = {
        'records': records,
        'total_properties': total_properties,
        'raw_data': raw_data,
        'date_range': {
            'min': date_range[0].strftime('%Y-%m-%d'),
            'max': date_range[1].strftime('%Y-%m-%d')
        }
    }
    
    logger.info("\n=== Response Data ===")
    logger.info(f"Keys: {response_data.keys()}")
    logger.info(f"Date range: {response_data['date_range']}")
    logger.info(f"Total properties: {response_data['total_properties']}")
    
    return jsonify(response_data)

def find_free_port(start_port=5002, max_port=5010):
    """Find a free port to use, starting from start_port."""
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except socket.error:
                continue
    return None

def cleanup():
    """Cleanup function to run when the app exits."""
    print("\nCleaning up...")
    # Add any cleanup code here if needed

# Register the cleanup function to run on normal exit and signals
atexit.register(cleanup)
signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))

# URL generation helper
def get_base_url():
    if os.environ.get('GITHUB_ACTIONS'):
        return '/databoard'
    return ''

# Register URL processors
@app.context_processor
def utility_processor():
    def asset_url(path):
        base = get_base_url()
        return f"{base}/{path.lstrip('/')}"
    return dict(asset_url=asset_url)

if __name__ == '__main__':
    port = find_free_port(5006, 5010)
    if port is None:
        print("No free ports found between 5006 and 5010")
        sys.exit(1)
    
    print(f"\nStarting server on port {port}")
    try:
        app.run(debug=False, port=port, use_reloader=False)
    except OSError as e:
        print(f"\nError starting server: {e}")
        print("Try killing any existing Flask processes and try again.")
        sys.exit(1) 