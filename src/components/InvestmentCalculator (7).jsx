import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';

const InvestmentCalculator = () => {
  const [birthDate, setBirthDate] = useState({ day: '26', month: '12', year: '1964' });
  const [spData, setSpData] = useState([]);
  const [results, setResults] = useState(null);
  const [retirementAge, setRetirementAge] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState(null);

  const isValidDate = (day, month, year) => {
    if (!day || !month || !year) return false;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getDate() === parseInt(day) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getFullYear() === parseInt(year);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/sp500-calculator/data/sp500_data.csv');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setSpData(results.data);
            setDataLoaded(true);
          },
          error: (error) => {
            console.error('Parse error:', error);
            setError('Error parsing CSV: ' + error.message);
          }
        });
      } catch (error) {
        console.error('Load error:', error);
        setError('Error loading data: ' + error.message);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded && birthDate.day && birthDate.month && birthDate.year) {
      calculateInvestment();
    }
  }, [birthDate, dataLoaded, retirementAge]);

  const calculateFutureValue = (presentValue, years, annualReturn) => {
    return presentValue * Math.pow(1 + annualReturn, years);
  };

  const calculateCurrentInvestment = (birthDateObj) => {
    if (!birthDateObj || isNaN(birthDateObj.getTime())) {
      return {
        totalInvested: 0,
        currentValue: 0,
        investmentData: [],
        latestDate: null
      };
    }
    const lastDataRow = spData[spData.length - 1];
    const [lastDay, lastMonth, lastYear] = lastDataRow.Month.split('/');
    const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, parseInt(lastDay));
    
    if (birthDateObj > lastDate) {
      return {
        totalInvested: 0,
        currentValue: 0,
        investmentData: [],
        latestDate: lastDataRow.Month
      };
    }

    const monthlyInvestment = 100;
    let units = 0;
    let totalMonths = 0;
    const investmentData = [];

    for (const row of spData) {
      if (!row.Month || !row.Closing) continue;
      
      const [day, month, year] = row.Month.split('/');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (monthDate >= birthDateObj && monthDate <= lastDate) {
        totalMonths++;
        const newUnits = monthlyInvestment / row.Closing;
        units += newUnits;
        
        investmentData.push({
          date: `${year}-${month}`,
          value: units * row.Closing,
          invested: monthlyInvestment * totalMonths
        });
      }
    }

    const currentValue = units * lastDataRow.Closing;
    const totalInvested = totalMonths * monthlyInvestment;

    return {
      totalInvested,
      currentValue,
      investmentData,
      latestDate: lastDataRow.Month
    };
  };

  const calculateInvestment = () => {
    if (!isValidDate(birthDate.day, birthDate.month, birthDate.year) || !spData.length) {
      setResults(null);
      return;
    }

    const birthDateObj = new Date(
      parseInt(birthDate.year),
      parseInt(birthDate.month) - 1,
      parseInt(birthDate.day)
    );

    const currentInvestment = calculateCurrentInvestment(birthDateObj);

    const lastDataRow = spData[spData.length - 1];
    const [lastDay, lastMonth, lastYear] = lastDataRow.Month.split('/');
    const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, parseInt(lastDay));
    
    const ageInMilliseconds = lastDate - birthDateObj;
    const currentAge = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25));

    const baseResults = {
      ...currentInvestment,
      investmentData: currentInvestment.investmentData.map(item => ({
        ...item,
        value: Math.round(item.value),
        invested: Math.round(item.invested)
      }))
    };

    if (retirementAge > currentAge) {
      const yearsToRetirement = retirementAge - currentAge;
      
      const futureValues = {
        scenario1: calculateFutureValue(currentInvestment.currentValue, yearsToRetirement, 0.0927),
        scenario2: calculateFutureValue(currentInvestment.currentValue, yearsToRetirement, 0.1243),
        scenario3: calculateFutureValue(currentInvestment.currentValue, yearsToRetirement, 0.149)
      };

      setResults({
        ...baseResults,
        yearsToRetirement,
        monthsToRetirement: 0,
        futureValues
      });
    } else {
      setResults(baseResults);
    }
  };

  const handleDateChange = (field, value) => {
    setBirthDate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };
  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
          <CardTitle className="text-3xl font-bold text-center mb-2">החסכון שנולד איתי</CardTitle>
          <p className="text-sm opacity-90 text-center mb-1">
            גלה את פוטנציאל החסכון שהיה מצטבר מיום לידתך
            <br />
            חיסכון של 100$ בחודש
          </p>
          <p className="text-sm opacity-90 text-center mb-1">
            מבוסס על נתוני מדד S&P500
          </p>
          <p className="text-sm opacity-90 text-center" dir="rtl">@פרופ' גיל</p>
        </CardHeader>
        
        <CardContent className="p-8">
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
                  onChange={(e) => handleDateChange('day', e.target.value)}
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
                  onChange={(e) => handleDateChange('month', e.target.value)}
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
                  onChange={(e) => handleDateChange('year', e.target.value)}
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
              <div className="text-red-500 text-center">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-8">
                <div className="text-sm text-gray-500 text-center">
                  נכון לתאריך: {results.latestDate}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2 text-center">
                        סך הכל הושקע
                      </h3>
                      <p className="text-3xl font-bold text-blue-800 text-center">
                        {formatCurrency(results.totalInvested)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg transition-shadow">
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

                {results.futureValues && (
                  <div>
                    <div className="text-center text-xl font-semibold text-gray-800 mb-4">
                      תחזית לגיל {retirementAge}
                      {results.yearsToRetirement > 0 ? 
                        ` (בעוד ${results.yearsToRetirement} שנים)` : ''
                      }
                    </div>
                    <div className="text-center text-sm text-gray-600 mb-6">
                      בהתבסס על הערך הנוכחי של התיק וממוצעי התשואה ההיסטוריים
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית שמרנית
                            <div className="text-sm text-orange-700">
                              לפי ממוצע 20 השנים האחרונות
                              <br />
                              תשואה שנתית: 9.27%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario1)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית מאוזנת
                            <div className="text-sm text-orange-700">
                              לפי ממוצע 10 השנים האחרונות
                              <br />
                              תשואה שנתית: 12.43%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario2)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית אופטימית
                            <div className="text-sm text-orange-700">
                              לפי ממוצע 5 השנים האחרונות
                              <br />
                              תשואה שנתית: 14.9%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario3)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-center">התפתחות ההשקעה לאורך זמן</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.investmentData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="date" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '0.5rem',
                              border: 'none',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="שווי תיק"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="invested"
                            name="סכום שהושקע"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentCalculator;
