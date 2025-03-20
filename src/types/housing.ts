export interface HousingData {
  id: number;
  price: number;
  num_rooms: number;
  num_bathrooms: number;
  square_footage: number;
  year_built: number;
  garage: boolean;
  pool: boolean;
  location: string;
  days_on_market: number;
  neighborhood: string;
  lot_size: number;
  condition: string;
  lat: number;
  long: number;
  sale_date: string;
}

export interface AggregatedRecord {
  neighborhood: string;
  location: string;
  price: number;
  count: number;
}

export interface ApiResponse {
  records: AggregatedRecord[];
  total_properties: number;
  raw_data: HousingData[];
  date_range: {
    min: string;
    max: string;
  };
} 