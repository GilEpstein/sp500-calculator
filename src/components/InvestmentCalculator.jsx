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
        if (!response.ok) throw new Error('Failed to load data');

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

    const endDate = new Date(2025, 0, 31);
    const monthlyInvestment = 100;
    let totalUnits = 0;
    let totalInvested = 0;
    let prevMonth = null;
    let startedInvesting = false;
    const investmentData = [];

    const filteredData = spData.filter(row => {
      if (!row.Month || !row.Closing) return false;

      let [day, month, year] = row.Month.split('/');
      day = parseInt(day);
      month = parseInt(month) - 1;
      year = parseInt(year);

      const monthDate = new Date(year, month, day);
      return !isNaN(monthDate) && monthDate >= birthDateObj;
    });

    if (filteredData.length > 0) {
      console.log("Birth date selected:", birthDateObj.toLocaleDateString());
      console.log("First month after filtering:", filteredData[0].Month);
      console.log("Total months counted:", filteredData.length);
    }

    for (const row of filteredData) {
      const [day, month, year] = row.Month.split('/');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const yearMonth = `${year}-${month}`;

      if (!startedInvesting && monthDate >= birthDateObj) {
        startedInvesting = true;
        totalUnits = 0;
        totalInvested = 0;
      }

      if (startedInvesting && monthDate <= endDate && yearMonth !== prevMonth) {
        const unitsThisMonth = monthlyInvestment / row.Closing;
        totalUnits += unitsThisMonth;
        totalInvested += monthlyInvestment;

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

    const lastPrice = filteredData[filteredData.length - 1].Closing;
    const currentValue = totalUnits * lastPrice;

    setResults({
      totalInvested,
      currentValue,
      totalUnits,
      lastPrice,
      investmentData,
      latestDate: filteredData[filteredData.length - 1].Month
    });

    // ✅ תיקון - Push מסונכרן ל-gh-pages
    deployToGitHubPages();
  };

  const deployToGitHubPages = () => {
    const exec = require("child_process").exec;

    exec("git checkout gh-pages && git pull origin gh-pages --rebase && git add . && git commit -m 'Update GitHub Pages deployment' && git push origin gh-pages || git push origin gh-pages --force",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error deploying: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      }
    );
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
          <p className="text-sm opacity-90 text-center">@פרופ' גיל</p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {['day', 'month', 'year'].map((field, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field === 'day' ? 'יום' : field === 'month' ? 'חודש' : 'שנה'}</label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2"
                  min={field === 'year' ? 1930 : 1}
                  max={field === 'year' ? 2024 : field === 'day' ? 31 : 12}
                  value={birthDate[field]}
                  onChange={(e) => handleDateChange(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          {results && (
            <div className="text-center mt-6">
              <p>סה"כ הושקע: {formatCurrency(results.totalInvested)}</p>
              <p>שווי נוכחי: {formatCurrency(results.currentValue)}</p>
              <p>סה"כ יחידות: {results.totalUnits.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentCalculator;
