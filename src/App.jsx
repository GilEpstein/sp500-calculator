
import React from 'react';
import InvestmentCalculator from './components/InvestmentCalculator';

function App() {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div>
        <InvestmentCalculator />

        <div className="flex justify-center gap-4 mt-8 mb-6">
          <a
            href="https://chat.whatsapp.com/Eiji0CIWupSLZBPjXQf8MI"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-green-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.073.528 4.012 1.453 5.703L0 24l6.488-1.707A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.55 9.55 0 01-4.873-1.342l-.349-.205-3.845.972.997-3.746-.226-.364A9.543 9.543 0 012.4 12 9.6 9.6 0 1112 21.6zm5.341-7.043c-.295-.148-1.747-.861-2.019-.96-.271-.1-.469-.148-.667.15-.197.295-.765.96-.938 1.157-.173.197-.345.222-.64.074-.295-.148-1.245-.457-2.37-1.459-.876-.781-1.468-1.744-1.64-2.039-.173-.296-.018-.456.13-.604.134-.134.296-.347.444-.521.148-.174.197-.296.296-.494.099-.198.05-.37-.025-.519-.075-.148-.668-1.612-.915-2.207-.242-.579-.487-.5-.667-.51l-.571-.01a1.108 1.108 0 00-.802.372c-.276.296-1.053 1.03-1.053 2.51 0 1.48 1.077 2.91 1.226 3.113.148.197 2.116 3.23 5.13 4.528.717.309 1.276.494 1.713.632.72.229 1.374.197 1.892.12.577-.085 1.747-.713 1.994-1.402.247-.689.247-1.279.173-1.402-.074-.123-.27-.198-.565-.345z" />
            </svg>
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
