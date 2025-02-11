import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Papa from 'papaparse';
import { Calendar } from 'lucide-react';

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
        const response = await window.fs.readFile('public/data/sp500_data.csv');
        const text = new TextDecoder().decode(response);
        Papa.parse(text, {
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
    
    // חישוב גיל מדויק כולל חודשים
    const ageInMilliseconds = lastDate - birthDateObj;
    const totalMonths = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24 * 30.4375));
    const currentAge = totalMonths / 12;
    const currentAgeYears = Math.floor(currentAge);
    const currentAgeMonths = Math.floor((currentAge - currentAgeYears) * 12);

    const baseResults = {
      ...currentInvestment,
      investmentData: currentInvestment.investmentData.map(item => ({
        ...item,
        value: Math.round(item.value),
        invested: Math.round(item.invested)
      }))
    };

    if (retirementAge > currentAgeYears) {
      const yearsToRetirement = retirementAge - currentAgeYears;
      const monthsToRetirement = 12 - currentAgeMonths;
      const totalYearsToRetirement = yearsToRetirement + (monthsToRetirement / 12);
      
      const futureValues = {
        scenario1: calculateFutureValue(currentInvestment.currentValue, totalYearsToRetirement, 0.0927),
        scenario2: calculateFutureValue(currentInvestment.currentValue, totalYearsToRetirement, 0.1243),
        scenario3: calculateFutureValue(currentInvestment.currentValue, totalYearsToRetirement, 0.149)
      };

      setResults({
        ...baseResults,
        yearsToRetirement,
        monthsToRetirement,
        futureValues
      });
    } else {
      setResults(baseResults);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  const handleDateInput = (value) => {
    const datePattern = /^(\d{1,2})[/]?(\d{1,2})?[/]?(\d{0,4})?$/;
    const match = value.match(datePattern);
    
    if (match) {
      const [_, day, month, year] = match;
      if (day) handleDateChange('day', day);
      if (month) handleDateChange('month', month);
      if (year) handleDateChange('year', year);
    }
  };

  const handleDateChange = (field, value) => {
    setBirthDate(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-gradient-to-b from-blue-50 to-white min-h-screen" dir="rtl">
      <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center mb-3">החסכון שנולד איתי</CardTitle>
          <p className="text-sm opacity-90 text-center mb-2">
            גלה את פוטנציאל החסכון שהיה מצטבר מיום לידתך
            <br />
            חיסכון של 100$ בחודש
          </p>
          <p className="text-xs md:text-sm opacity-90 text-center">
            מבוסס על נתוני מדד S&P500
            <br />
            @פרופ' גיל
          </p>
        </CardHeader>
        
        <CardContent className="p-4 md:p-8">
          <div className="space-y-6 md:space-y-8">
            {/* Date Input Section */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 inline-flex">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">תאריך לידה:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    className="w-32 py-1.5 px-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-right"
                    value={`${birthDate.day}/${birthDate.month}/${birthDate.year}`}
                    onChange={(e) => handleDateInput(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">גיל פרישה:</span>
                    <input
                      type="number"
                      className="w-16 py-1.5 px-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(Number(e.target.value))}
                      min="0"
                      max="120"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-6">
                <div className="text-sm text-gray-500 text-center">
                  נכון לתאריך: {results.latestDate}
                </div>
                
                {/* Results Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2 text-center">
                        סך הכל הושקע
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-blue-800 text-center">
                        {formatCurrency(results.totalInvested)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-2 text-center">
                        שווי נוכחי
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold text-green-800 text-center">
                        {formatCurrency(results.currentValue)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Future Values Section */}
                {results.futureValues && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-gray-800 mb-2">
                        תחזית לגיל {retirementAge}
                        {results.yearsToRetirement > 0 ? 
                          ` (בעוד ${results.yearsToRetirement} שנים ו-${results.monthsToRetirement} חודשים)` : ''
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        בהתבסס על הערך הנוכחי של התיק וממוצעי התשואה ההיסטוריים
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Conservative Scenario */}
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית שמרנית
                            <div className="text-sm text-orange-700">
                              ממוצע 20 שנים | 9.27%
                            </div>
                          </h3>
                          <p className="text-xl md:text-2xl font-bold text-orange-800 text-center mt-2">
                            {formatCurrency(results.futureValues.scenario1)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Balanced Scenario */}
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית מאוזנת
                            <div className="text-sm text-orange-700">
                              ממוצע 10 שנים | 12.43%
                            </div>
                          </h3>
                          <p className="text-xl md:text-2xl font-bold text-orange-800 text-center mt-2">
                            {formatCurrency(results.futureValues.scenario2)}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Optimistic Scenario */}
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית אופטימית
                            <div className="text-sm text-orange-700">
                              ממוצע 5 שנים | 14.9%
                            </div>
                          </h3>
                          <p className="text-xl md:text-2xl font-bold text-orange-800 text-center mt-2">
                            {formatCurrency(results.futureValues.scenario3)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Chart Section */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-center">התפתחות ההשקעה לאורך זמן</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64 md:h-96">
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
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="invested"
                            name="סכום שהושקע"
                            stroke="#22c55e"
                            strokeWidth={2}
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
}

export default InvestmentCalculator;
