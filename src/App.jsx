import React from 'react';
import InvestmentCalculator from './components/InvestmentCalculator';

function App() {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div>
        <InvestmentCalculator />
      </div>
      
      <div className="flex justify-center gap-4 mt-8 mb-6">
        <a
          href="https://chat.whatsapp.com/Eiji0CIWupSLZBPjXQf8MI"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-green-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.78 11.78 0 0012 0a11.78 11.78 0 00-8.52 3.48A11.78 11.78 0 000 12c0 2.07.52 4.05 1.52 5.81L0 24l6.28-1.48A11.78 11.78 0 0012 24a11.78 11.78 0 008.52-3.48A11.78 11.78 0 0024 12a11.78 11.78 0 00-3.48-8.52zM12 21.6c-1.76 0-3.5-.46-5.02-1.34l-.36-.2-3.74.88.88-3.74-.2-.36A9.58 9.58 0 012.4 12 9.6 9.6 0 0112 2.4 9.6 9.6 0 0121.6 12 9.6 9.6 0 0112 21.6zm5.64-7.32c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.95-.95 1.14-.17.2-.35.22-.64.07-.3-.15-1.27-.47-2.43-1.5-.9-.8-1.5-1.8-1.67-2.1-.17-.3-.02-.46.13-.6.13-.12.3-.32.45-.48.15-.17.2-.27.3-.45.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37s-1.05 1.03-1.05 2.5c0 1.46 1.08 2.87 1.23 3.07.15.2 2.12 3.26 5.13 4.57.72.3 1.27.48 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.76-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35z"/></svg>
          הצטרף לקבוצת הווטסאפ
        </a>
        <a
          href="https://gilepstein.github.io/prof-gil-website/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition"
        >
          בקר באתר שלי
        </a>
      </div>

      <footer className="text-center text-sm text-gray-500 mb-4 px-4">
        הבהרה: המידע באתר מיועד ללימוד בלבד ואינו מהווה הצעה לקנייה או מכירה של מוצרים פיננסיים.
        איני יועץ השקעות מוסמך, והמידע אינו מחליף ייעוץ מותאם אישית.
        החלטות השקעה על אחריותכם בלבד. ייתכן שאני מחזיק בחלק מהמניות או המדדים המוזכרים.
      </footer>
    </div>
  );
}

export default App;
