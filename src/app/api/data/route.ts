import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { HousingData, ApiResponse } from '@/types/housing';

export async function GET() {
  try {
    // Read the CSV file from public directory
    const filePath = path.join(process.cwd(), 'public', 'data', 'housing_data.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse CSV data
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    const data: HousingData[] = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        id: parseInt(values[0]),
        price: parseFloat(values[1]),
        num_rooms: parseInt(values[2]),
        num_bathrooms: parseInt(values[3]),
        square_footage: parseFloat(values[4]),
        year_built: parseInt(values[5]),
        garage: values[6] === 'true',
        pool: values[7] === 'true',
        location: values[8],
        days_on_market: parseInt(values[9]),
        neighborhood: values[10],
        lot_size: parseFloat(values[11]),
        condition: values[12],
        lat: parseFloat(values[13]),
        long: parseFloat(values[14]),
        sale_date: values[15]
      };
    });

    // Aggregate data by neighborhood
    const aggregatedData = data.reduce((acc: { [key: string]: any }, curr) => {
      const key = curr.neighborhood;
      if (!acc[key]) {
        acc[key] = {
          neighborhood: key,
          location: curr.location,
          price: 0,
          count: 0
        };
      }
      acc[key].price += curr.price;
      acc[key].count += 1;
      return acc;
    }, {});

    // Calculate average prices
    Object.values(aggregatedData).forEach(record => {
      record.price = record.price / record.count;
    });

    // Get date range
    const dates = data.map(d => new Date(d.sale_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const response: ApiResponse = {
      records: Object.values(aggregatedData),
      total_properties: data.length,
      raw_data: data,
      date_range: {
        min: minDate.toISOString().split('T')[0],
        max: maxDate.toISOString().split('T')[0]
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
} 