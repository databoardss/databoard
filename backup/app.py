from flask import Flask, render_template, jsonify
import pandas as pd
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

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

if __name__ == '__main__':
    logger.info("\n=== Starting Flask Application ===")
    logger.info("Dataset Preview:")
    logger.info(df.head())
    app.run(debug=True, port=5002) 