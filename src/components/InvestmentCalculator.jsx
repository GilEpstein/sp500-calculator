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
  const [results, setResults] = useState(null);
  const [retirementAge, setRetirementAge] = useState(67);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [spData, setSpData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!window.fs) {
          throw new Error('לא ניתן לטעון את נתוני המדד');
        }

        const csvContent = await window.fs.readFile('/sp500-calculator/public/data/sp500_data.csv', { encoding: 'utf8' });
        
        Papa.parse(csvContent, {
          header: true,
          delimiter: "\t",  // Using tab as delimiter
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              console.error('Parse errors:', results.errors);
              setError('שגיאה בפרסור נתוני המדד');
              setIsLoading(false);
              return;
            }
            
            console.log('Parsed data sample:', results.data.slice(0, 5));
            
            if (!results.data || results.data.length === 0) {
              setError('לא נמצאו נתונים בקובץ');
              setIsLoading(false);
              return;
            }

            // Validate data structure
            if (!results.data[0].Month || !results.data[0].Closing) {
              setError('מבנה הנתונים בקובץ אינו תקין');
              setIsLoading(false);
              return;
            }

            setSpData(results.data);
            setIsLoading(false);
          },
          error: (error) => {
            setError('שגיאה בטעינת נתוני המדד: ' + error.message);
            setIsLoading(false);
          }
        });
      } catch (error) {
        setError('שגיאה בטעינת נתוני המדד: ' + error.message);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  const calculateInvestment = () => {
    if (!birthDate.year || spData.length === 0) return;

    const birthDateObj = new Date(
      parseInt(birthDate.year), 
      parseInt(birthDate.month) - 1, 
      parseInt(birthDate.day)
    );

    // Find relevant investment period
    const startIndex = spData.findIndex(data => {
      if (!data.Month) return false;
      const [day, month, year] = data.Month.split('/');
      const dataDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return dataDate >= birthDateObj;
    });

    if (startIndex === -1) {
      setError('לא נמצאו נתונים מתאריך הלידה');
      return;
    }

    const relevantData = spData.slice(startIndex);
    const monthlyInvestment = 100;
    const totalInvested = relevantData.length * monthlyInvestment;

    // Calculate units accumulated using dollar-cost averaging
    let totalUnits = 0;
    const investmentData = relevantData.map((month, index) => {
      const unitsThisMonth = monthlyInvestment / month.Closing;
      totalUnits += unitsThisMonth;
      
      const [day, monthNum, year] = month.Month.split('/');
      return {
        date: `${year}-${monthNum}`,
        value: Math.round(totalUnits * month.Closing),
        invested: monthlyInvestment * (index + 1)
      };
    });

    const currentValue = totalUnits * relevantData[relevantData.length - 1].Closing;
    const lastDataPoint = spData[spData.length - 1];
    
    // Calculate years and months to retirement
    const [lastDay, lastMonth, lastYear] = lastDataPoint.Month.split('/');
    const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, parseInt(lastDay));
    const diffTime = lastDate - birthDateObj;
    const currentAgeInMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));
    const currentAge = currentAgeInMonths / 12;
    
    const yearsToRetirement = Math.max(0, Math.floor(retirementAge - currentAge));
    const monthsToRetirement = Math.round((retirementAge - currentAge - yearsToRetirement) * 12);

    // Calculate future values
    const yearsWithMonthsFraction = yearsToRetirement + (monthsToRetirement / 12);
    
    const futureValues = retirementAge > currentAge ? {
      scenario1: currentValue * Math.pow(1 + 0.0927, yearsWithMonthsFraction),
      scenario2: currentValue * Math.pow(1 + 0.1243, yearsWithMonthsFraction),
      scenario3: currentValue * Math.pow(1 + 0.149, yearsWithMonthsFraction)
    } : null;

    setResults({
      totalInvested,
      currentValue,
      investmentData,
      latestDate: lastDataPoint.Month,
      yearsToRetirement,
      monthsToRetirement,
      futureValues
    });
  };

  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year && !isLoading) {
      calculateInvestment();
    }
  }, [birthDate, retirementAge, spData, isLoading]);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
          <CardTitle className="text-3xl font-bold text-center mb-2">החיסכון שנולד איתי</CardTitle>
          <p className="text-sm opacity-90 text-center mb-1">
            גלה את פוטנציאל החסכון שהיה מצטבר מיום לידתך
          </p>
          <p className="text-sm opacity-90 text-center">
            חיסכון של 100$ בחודש
          </p>
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
              <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-8">
                <div className="text-sm text-gray-500 text-center">
                  נכון לתאריך: {results.latestDate}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2 text-center">
                        סך הכל הושקע
                      </h3>
                      <p className="text-3xl font-bold text-blue-800 text-center">
                        {formatCurrency(results.totalInvested)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md">
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
                  <div className="space-y-8">
                    <div className="text-center text-xl font-semibold text-gray-800 mb-4">
                      תחזית לגיל {retirementAge}
                      {results.yearsToRetirement > 0 || results.monthsToRetirement > 0 ? 
                        ` (בעוד ${results.yearsToRetirement > 0 ? `${results.yearsToRetirement} שנים` : ''}${
                          results.yearsToRetirement > 0 && results.monthsToRetirement > 0 ? ' ו-' : ''
                        }${results.monthsToRetirement > 0 ? `${results.monthsToRetirement} חודשים` : ''})` 
                        : ''
                      }
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית שמרנית
                            <div className="text-sm text-orange-700">
                              תשואה שנתית: 9.27%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario1)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית מאוזנת
                            <div className="text-sm text-orange-700">
                              תשואה שנתית: 12.43%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario2)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                        <CardContent className="p-6">
                          <h3 className="text-base font-semibold text-orange-900 mb-2 text-center">
                            תחזית אופטימית
                            <div className="text-sm text-orange-700">
                              תשואה שנתית: 14.9%
                            </div>
                          </h3>
                          <p className="text-2xl font-bold text-orange-800 text-center mt-4">
                            {formatCurrency(results.futureValues.scenario3)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-8">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-center">התפתחות ההשקעה לאורך זמן</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentCalculator;
