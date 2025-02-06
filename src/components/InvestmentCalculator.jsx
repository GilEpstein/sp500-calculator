import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
 const [dataLoaded, setDataLoaded] = useState(false);
 const [error, setError] = useState(null);
 
 useEffect(() => {
   const loadData = async () => {
     try {
       const response = await fetch('/sp500-calculator/public/data/sp500_data.csv');
       if (!response.ok) {
         throw new Error('Failed to load data');
       }
       const csvText = await response.text();
       Papa.parse(csvText, {
         header: true,
         dynamicTyping: true,
         skipEmptyLines: true,
         complete: (results) => {
           console.log('Data loaded:', results.data.length, 'rows');
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

 const calculateInvestment = () => {
   if (!birthDate.year || !spData.length) return;

   const birthDateObj = new Date(
     parseInt(birthDate.year), 
     parseInt(birthDate.month) - 1, 
     parseInt(birthDate.day)
   );
   const today = new Date('2025-01-01');
   const monthlyInvestment = 100;
   
   let units = 0;
   let totalInvested = 0;
   const investmentData = [];
   let latestDate = '';
   
   for (const row of spData) {
     if (!row.Month || !row.Closing) continue;
     
     const [day, month, year] = row.Month.split('/');
     const monthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     
     if (monthDate >= birthDateObj && monthDate <= today) {
       const newUnits = monthlyInvestment / row.Closing;
       units += newUnits;
       totalInvested += monthlyInvestment;
       latestDate = row.Month;
       
       const currentValue = units * row.Closing;
       
       investmentData.push({
         date: `${year}-${month}`,
         value: currentValue,
         invested: totalInvested
       });
     }
   }

   const currentValue = units * spData[spData.length-1].Closing;
   const yearlyReturn = currentValue * 0.149;
   
   setResults({
     totalInvested,
     currentValue,
     yearlyReturn,
     investmentData: investmentData.map(item => ({
       ...item,
       value: Math.round(item.value),
       invested: Math.round(item.invested)
     })),
     latestDate
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
           גלה את פוטנציאל החסכון שהיה מצטבר מיום לידתך מבוסס על נתוני מדד S&P500
         </p>
         <p className="text-sm opacity-90 text-center">פרופ' גיל@</p>
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
                 onChange={(e) => {
                   setRetirementAge(Number(e.target.value));
                   calculateInvestment();
                 }}
                 min="60"
                 max="80"
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
               
               <div className="grid grid-cols-2 gap-6">
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

               <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <CardTitle className="text-center text-purple-900">
                     תוספת שנתית
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                   <p className="text-3xl font-bold text-purple-800 text-center">
                     {formatCurrency(results.yearlyReturn)}
                   </p>
                 </CardContent>
               </Card>

               <Card className="shadow-md hover:shadow-lg transition-shadow">
                 <CardHeader>
                   <CardTitle className="text-center">
                     התפתחות ההשקעה לאורך זמן
                   </CardTitle>
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
