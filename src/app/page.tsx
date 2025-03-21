'use client';

import { useEffect, useState, useRef } from 'react';
import { ApiResponse, AggregatedRecord, HousingData } from '@/types/housing';
import dynamic from 'next/dynamic';
import * as d3 from 'd3';
import crossfilter from 'crossfilter2';

// Dynamically import Chart.js components
const LineChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [filteredData, setFilteredData] = useState<HousingData[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolFilter, setPoolFilter] = useState<boolean | null>(null);
  const [garageFilter, setGarageFilter] = useState<boolean | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const dateSliderRef = useRef<HTMLDivElement>(null);
  const cfRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data?.raw_data && dateSliderRef.current) {
      initializeDateSlider();
      initializeCrossfilter();
    }
  }, [data]);

  useEffect(() => {
    if (cfRef.current) {
      applyFilters();
    }
  }, [poolFilter, garageFilter, selectedRoom, selectedMonth]);

  const initializeCrossfilter = () => {
    if (!data?.raw_data) return;
    const cf = crossfilter(data.raw_data);
    cfRef.current = cf;
    applyFilters();
  };

  const applyFilters = () => {
    if (!cfRef.current) return;

    const cf = cfRef.current;
    const dateDim = cf.dimension((d: HousingData) => new Date(d.sale_date));
    const poolDim = cf.dimension((d: HousingData) => d.pool);
    const garageDim = cf.dimension((d: HousingData) => d.garage);
    const roomDim = cf.dimension((d: HousingData) => d.num_rooms);
    const monthDim = cf.dimension((d: HousingData) => d3.timeMonth(new Date(d.sale_date)));

    // Reset all filters
    [dateDim, poolDim, garageDim, roomDim, monthDim].forEach(dim => dim.filterAll());

    // Apply filters
    dateDim.filter([dateRange[0], dateRange[1]]);
    if (poolFilter !== null) poolDim.filter(poolFilter);
    if (garageFilter !== null) garageDim.filter(garageFilter);
    if (selectedRoom !== null) roomDim.filter(selectedRoom);
    if (selectedMonth !== null) monthDim.filter(selectedMonth);

    // Get filtered data
    const filtered = dateDim.top(Infinity);
    setFilteredData(filtered);
  };

  const handleBarClick = (event: any, elements: any) => {
    if (elements.length === 0) {
      setSelectedRoom(null);
      return;
    }
    const roomCount = parseInt(getRoomDistribution().labels[elements[0].index]);
    setSelectedRoom(selectedRoom === roomCount ? null : roomCount);
  };

  const handleLineClick = (event: any, elements: any) => {
    if (elements.length === 0) {
      setSelectedMonth(null);
      return;
    }
    const monthIndex = elements[0].index;
    const monthDate = Array.from(d3.group(filteredData, d => d3.timeMonth(new Date(d.sale_date))))
      .sort((a, b) => a[0].getTime() - b[0].getTime())[monthIndex][0];
    setSelectedMonth(selectedMonth?.getTime() === monthDate.getTime() ? null : monthDate);
  };

  const updateFilters = ([start, end]: [Date, Date]) => {
    setDateRange([start, end]);
    applyFilters();
  };

  const getMonthlyData = () => {
    const monthlyData = d3.group(filteredData, d => d3.timeMonth(new Date(d.sale_date)));
    const sortedMonths = Array.from(monthlyData).sort((a, b) => a[0].getTime() - b[0].getTime());
    return {
      labels: sortedMonths.map(([month]) => month.toLocaleString('default', { month: 'short' })),
      data: sortedMonths.map(([_, sales]) => sales.length)
    };
  };

  const getRoomDistribution = () => {
    const roomCounts = d3.group(filteredData, d => d.num_rooms);
    const sortedRooms = Array.from(roomCounts).sort((a, b) => a[0] - b[0]);
    return {
      labels: sortedRooms.map(([rooms]) => rooms.toString()),
      data: sortedRooms.map(([_, houses]) => houses.length)
    };
  };

  const initializeDateSlider = () => {
    if (!dateSliderRef.current || !data?.raw_data) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = dateSliderRef.current.clientWidth - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    // Clear existing content
    d3.select(dateSliderRef.current).selectAll("*").remove();

    const svg = d3.select(dateSliderRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const dates = data.raw_data.map(d => new Date(d.sale_date)).filter(d => !isNaN(d.getTime()));
    const x = d3.scaleTime()
      .domain([d3.min(dates) || new Date(), d3.max(dates) || new Date()])
      .range([0, width]);

    // Create brush
    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("end", (event) => {
        if (!event.selection) return;
        const [x0, x1] = event.selection.map(x.invert) as [Date, Date];
        updateFilters([x0, x1]);
      });

    // Add brush to svg
    const brushGroup = svg.append("g")
      .attr("class", "brush")
      .call(brush);

    // Set initial brush position
    const range = x.range();
    brushGroup.call(brush.move as any, range);

    // Add axis
    const xAxis = d3.axisBottom(x);
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const jsonData = await response.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }
      setData(jsonData);
      setFilteredData(jsonData.raw_data);
      if (jsonData.date_range) {
        setDateRange([new Date(jsonData.date_range.min), new Date(jsonData.date_range.max)]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getAggregatedData = () => {
    if (!filteredData.length) return [];

    const aggregated = filteredData.reduce((acc: { [key: string]: AggregatedRecord }, curr) => {
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
    Object.values(aggregated).forEach(record => {
      record.price = record.price / record.count;
    });

    return Object.values(aggregated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error || 'Error loading data'}</div>
      </div>
    );
  }

  const aggregatedData = getAggregatedData();

  return (
    <main className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">Housing Dashboard</h1>

        <div className="flex justify-between items-start mb-6">
          {/* Left side - Metrics */}
          <div className="space-y-4">
            <div>
              <h3 className="text-purple-700 font-medium">Total Houses</h3>
              <p className="text-4xl font-bold">{filteredData.length}</p>
            </div>
            <div>
              <h3 className="text-purple-700 font-medium">Average Lot Size</h3>
              <p className="text-4xl font-bold">
                {((d3.mean(filteredData, d => d.lot_size) || 0) / 1000).toFixed(2)}K
              </p>
            </div>
            <div>
              <h3 className="text-purple-700 font-medium">Average Days on Market</h3>
              <p className="text-4xl font-bold">
                {(d3.mean(filteredData, d => d.days_on_market) || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Right side - Filters */}
          <div className="flex gap-4">
            <div>
              <span className="text-sm text-gray-600">Pool</span>
              <div className="flex gap-1 mt-1">
                <button 
                  className={`px-2 py-1 ${poolFilter === false ? 'bg-black text-white' : 'bg-gray-200'}`}
                  onClick={() => setPoolFilter(poolFilter === false ? null : false)}
                >
                  0
                </button>
                <button 
                  className={`px-2 py-1 ${poolFilter === true ? 'bg-black text-white' : 'bg-gray-200'}`}
                  onClick={() => setPoolFilter(poolFilter === true ? null : true)}
                >
                  1
                </button>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Garage</span>
              <div className="flex gap-1 mt-1">
                <button 
                  className={`px-2 py-1 ${garageFilter === false ? 'bg-black text-white' : 'bg-gray-200'}`}
                  onClick={() => setGarageFilter(garageFilter === false ? null : false)}
                >
                  0
                </button>
                <button 
                  className={`px-2 py-1 ${garageFilter === true ? 'bg-black text-white' : 'bg-gray-200'}`}
                  onClick={() => setGarageFilter(garageFilter === true ? null : true)}
                >
                  1
                </button>
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-600">Sale Date</span>
              <div className="text-sm text-gray-600 mb-1">
                {dateRange[0].toLocaleDateString()} - {dateRange[1].toLocaleDateString()}
              </div>
              <div ref={dateSliderRef} className="w-48" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-2">Count of num_rooms by num_rooms</h2>
            <div className="h-48">
              <BarChart
                data={{
                  labels: getRoomDistribution().labels,
                  datasets: [{
                    label: 'Number of Houses',
                    data: getRoomDistribution().data,
                    backgroundColor: (ctx: any) => {
                      const label = getRoomDistribution().labels[ctx.dataIndex];
                      return selectedRoom === parseInt(label) ? 'rgb(0, 122, 255)' : 'rgba(0, 122, 255, 0.3)';
                    },
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  onClick: handleBarClick,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-2">Count of sale_date by Month</h2>
            <div className="h-48">
              <LineChart
                data={{
                  labels: getMonthlyData().labels,
                  datasets: [{
                    label: 'Number of Sales',
                    data: getMonthlyData().data,
                    borderColor: 'rgb(0, 122, 255)',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: (ctx: any) => {
                      const monthDate = Array.from(d3.group(filteredData, d => d3.timeMonth(new Date(d.sale_date))))
                        .sort((a, b) => a[0].getTime() - b[0].getTime())[ctx.dataIndex]?.[0];
                      return selectedMonth?.getTime() === monthDate?.getTime() ? 'rgb(0, 122, 255)' : 'rgba(0, 122, 255, 0.3)';
                    },
                    pointRadius: 4,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  onClick: handleLineClick,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-normal text-gray-500 py-2">condition</th>
                <th className="text-left text-xs font-normal text-gray-500 py-2">days_on_market</th>
                <th className="text-left text-xs font-normal text-gray-500 py-2">id</th>
                <th className="text-left text-xs font-normal text-gray-500 py-2">location</th>
                <th className="text-left text-xs font-normal text-gray-500 py-2">price</th>
                <th className="text-left text-xs font-normal text-gray-500 py-2">sale_date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((house) => (
                <tr key={house.id} className="border-b">
                  <td className="py-2 text-sm">{house.condition}</td>
                  <td className="py-2 text-sm">{house.days_on_market}</td>
                  <td className="py-2 text-sm">{house.id}</td>
                  <td className="py-2 text-sm">{house.location}</td>
                  <td className="py-2 text-sm">${house.price.toLocaleString()}</td>
                  <td className="py-2 text-sm">{new Date(house.sale_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
} 