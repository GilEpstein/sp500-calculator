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
    <div>
      {/* חלק התצוגה יבוא כאן */}
    </div>
  );
};

export default InvestmentCalculator;
