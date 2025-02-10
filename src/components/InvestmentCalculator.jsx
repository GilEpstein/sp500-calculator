import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';

export default function InvestmentCalculator() {
  const [birthDate, setBirthDate] = useState({
    day: '',
    month: '',
    year: ''
  });
  const [spData, setSpData] = useState([]);
  const [results, setResults] = useState(null);
  const [retirementAge, setRetirementAge] = useState(67);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('sp500_data.csv', { encoding: 'utf8' });
        Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setSpData(results.data);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
          }
        });
      } catch (error) {
        setError('Error loading data: ' + error.message);
      }
    };
    loadData();
  }, []);

  const calculateInvestment = () => {
    if (!birthDate.year || !spData.length) return;

    const birthDateObj = new Date(
      parseInt(birthDate.year), 
      parseInt(birthDate.month) - 1, 
      parseInt(birthDate.day)
    );

    // Find first valid data point after birth date
    const firstValidRow = spData.find(row => {
      if (!row.Month) return false;
      const [day, month, year] = row.Month.split('/');
      const rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return rowDate >= birthDateObj;
    });

    if (!firstValidRow) {
      setResults({
        totalInvested: 0,
        currentValue: 0
      });
      return;
    }

    // Calculate basic investment data
    let totalInvested = 0;
    let units = 0;
    
    for (const row of spData) {
      if (!row.Month || !row.Closing) continue;
      
      const [day, month, year] = row.Month.split('/');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (monthDate >= birthDateObj) {
        const monthlyInvestment = 100;
        totalInvested += monthlyInvestment;
        units += monthlyInvestment / row.Closing;
      }
    }

    const lastRow = spData[spData.length - 1];
    const currentValue = units * lastRow.Closing;

    setResults({
      totalInvested,
      currentValue
    });
  };

  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      calculateInvestment();
    }
  }, [birthDate, spData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <Card className="shadow-xl">
        <CardHeader className="bg-blue-600 text-white p-6">
          <CardTitle className="text-3xl font-bold text-center">החסכון שנולד איתי</CardTitle>
          <p className="text-center opacity-90">חיסכון של 100$ בחודש</p>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-4 gap-6 mb-8">
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

          {error && (
            <div className="text-red-500 text-center mb-8">
              {error}
            </div>
          )}

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 text-center">
                    סך הכל הושקע
                  </h3>
                  <p className="text-3xl font-bold text-blue-800 text-center">
                    {formatCurrency(results.totalInvested)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2 text-center">
                    שווי נוכחי
                  </h3>
                  <p className="text-3xl font-bold text-green-800 text-center">
                    {formatCurrency(results.currentValue)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
