import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';

const InvestmentCalculator = () => {
  const [birthDate, setBirthDate] = useState({
    day: '',
    month: '',
    year: ''
  });
  const [spData, setSpData] = useState([]);
  const [results, setResults] = useState(null);
  const [retirementAge, setRetirementAge] = useState(67);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!window.fs || typeof window.fs.readFile !== 'function') {
          throw new Error('File system API is not available');
        }

        const response = await window.fs.readFile('public/data/sp500_data.csv', { encoding: 'utf8' });
        
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              setError('Error parsing CSV: ' + results.errors[0].message);
              return;
            }
            setSpData(results.data);
            setIsLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
            setIsLoading(false);
          }
        });
      } catch (error) {
        setError('Error loading data: ' + error.message);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
          <CardTitle className="text-3xl font-bold text-center mb-2">החסכון שנולד איתי</CardTitle>
          <p className="text-sm opacity-90 text-center mb-1">
            גלה את פוטנציאל החסכון שהיה מצטבר מיום לידתך
          </p>
          <p className="text-sm opacity-90 text-center">
            חיסכון של 100$ בחודש
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          {isLoading ? (
            <div className="text-center text-gray-600">טוען נתונים...</div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">יום</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2"
                    min="1"
                    max="31"
                    value={birthDate.day}
                    onChange={(e) => setBirthDate(prev => ({ ...prev, day: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">חודש</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2"
                    min="1"
                    max="12"
                    value={birthDate.month}
                    onChange={(e) => setBirthDate(prev => ({ ...prev, month: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שנה</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2"
                    min="1930"
                    max="2024"
                    value={birthDate.year}
                    onChange={(e) => setBirthDate(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">גיל פרישה</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    min="0"
                    max="120"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentCalculator;
