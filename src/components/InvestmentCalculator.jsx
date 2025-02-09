

```javascript
import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState(null);

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

  const calculateInvestment = () => {
    if (!birthDate.year || !spData.length) return;

    const birthDateObj = new Date(
      parseInt(birthDate.year), 
      parseInt(birthDate.month) - 1, 
      parseInt(birthDate.day)
    );

    const endDate = new Date(2025, 0, 31); // קבוע - 31 בינואר 2025
    const monthlyInvestment = 100;
    let totalUnits = 0;
    let totalInvested = 0;
    let prevMonth = null;
    const investmentData = [];

    // עוברים על כל הנתונים ההיסטוריים
    for (const row of spData) {
      if (!row.Month || !row.Closing) continue;

      const [day, month, year] = row.Month.split('/');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const yearMonth = `${year}-${month}`;

      // בודקים אם התאריך בטווח הרלוונטי
      if (monthDate >= birthDateObj && monthDate <= endDate && yearMonth !== prevMonth) {
        // חישוב יחידות חדשות לפי ההשקעה החודשית
        const unitsThisMonth = monthlyInvestment / row.Closing;
        totalUnits += unitsThisMonth;
        totalInvested += monthlyInvestment;

        // שמירת נתוני החודש
        investmentData.push({
          date: yearMonth,
          units: totalUnits,
          monthlyUnits: unitsThisMonth,
          value: totalUnits * row.Closing,
          invested: totalInvested,
          price: row.Closing
        });

        prevMonth = yearMonth;
      }
    }

    console.log('Birth date:', birthDateObj.toLocaleDateString());
    console.log('End date:', endDate.toLocaleDateString());
    console.log('Total months:', investmentData.length);
    console.log('Total invested:', totalInvested);
    console.log('Total units:', totalUnits);

    // חישוב השווי הנוכחי לפי המחיר האחרון
    const lastPrice = spData[spData.length - 1].Closing;
    const currentValue = totalUnits * lastPrice;

    // Separate calculations
    const totalInvestmentValue = totalInvested;
    const totalSharesValue = totalUnits * lastPrice;

    setResults({
      totalInvested,
      currentValue,
      totalUnits,
      lastPrice,
      investmentData,
      latestDate: spData[spData.length - 1].Month,
      totalInvestmentValue,
      totalSharesValue
    });
  };

  const handleDateChange = (field, value) => {
    setBirthDate(prev => ({
      ...prev,
      [field]: value
    }));
    setTimeout(calculateInvestment, 0);
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
            <div className="grid grid-cols-3 gap-6">
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
                        {formatCurrency(results.totalInvestmentValue)}
                      </p>
                      <p className="text-sm text-blue-600 text-center mt-2">
                        סה"כ יחידות: {results.totalUnits.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-2 text-center">
                        שווי נוכחי
                      </h3>
                      <p className="text-3xl font-bold text-green-800 text-center">
                        {formatCurrency(results.totalSharesValue)}
                      </p>
                      <p className="text-sm text-green-600 text-center mt-2">
                        מחיר אחרון: {formatCurrency(results.lastPrice)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div> 
  );
};

export default InvestmentCalculator;
```
