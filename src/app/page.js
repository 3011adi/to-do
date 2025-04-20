'use client';
import React from 'react';
import Link from 'next/link';

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" 
         style={{
           backgroundColor: "#FFFBEB", 
           backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEGSURBVGhD7ZdBCsIwFEXTrrrXLQii4LLc/8YFqdZf6DiIQvO/9cDblCTtgZtpm/Sqqqqqqqqqqqo3zuPiG3SZX16XWdgZdJEXkXdEFMaJ9tZyMhRTOOmg5yCyQB+JLBipSAuO37xyJsPZI18R4YwsgJeRwXCqLzPy3N8+LlsYCqeGYiMX3sOlJ2ZGhpdmRkQBGrEMIgvQiJURUYBGLI2IAjRibUQUoBEfIy5yJMST6Dvzw3GQzciNJX1RjCXfkQcHr2oN+0wZE+B2aLDQjBg42IoYDG0NDBiL5FcZ5LHJuMvQQNKTMNpEyTvQOZgUGRmv+jTkXwVEFnBHRJHHicDhExBZQFVVVVVVVVW9KaVe9/iBnV2iJ3IAAAAASUVORK5CYII=')", 
           backgroundRepeat: "repeat"
         }}>
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-16 h-16 transform rotate-12 opacity-60">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L9 17L19 7" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 w-16 h-16 transform -rotate-12 opacity-60">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 4H4V11" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 4L15 15" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 20V13H13" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 20L20 15" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* Main Content */}
      <div className="relative bg-amber-50 rounded-lg shadow-2xl border-t-8 border-amber-800 border-l-8 max-w-lg w-full overflow-hidden transform hover:scale-102 transition-transform duration-200">
        {/* Notebook Spiral Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around items-center">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-6 h-4 bg-amber-900 rounded-full opacity-80"></div>
          ))}
        </div>
        
        {/* Content Area */}
        <div className="ml-10 p-8" style={{
          backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, #F59E0B20 24px)", 
          backgroundSize: "100% 24px"
        }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold mb-3 text-amber-900 font-mono relative inline-block">
              Todo Notebook
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-amber-600"></div>
            </h1>
            <p className="text-amber-700 font-mono mt-4">Your pocket companion for productivity</p>
          </div>
          
          {/* Notebook Tab */}
          <div className="absolute -right-1 top-12 bg-amber-700 px-4 py-2 text-amber-50 font-mono transform -rotate-90 origin-bottom-right">
            Tasks
          </div>
          
          {/* Features */}
          <div className="mb-8 font-mono text-amber-800">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Simple & intuitive design</span>
            </div>
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Organize tasks by category</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Sync across all your devices</span>
            </div>
          </div>
          
          {/* Button */}
          <div className="text-center">
            <Link href="/auth">
              <button 
                className="bg-amber-700 hover:bg-amber-800 text-amber-50 font-bold py-3 px-8 rounded-md transition-all duration-300 transform hover:-translate-y-1 shadow-lg border-2 border-amber-800 font-mono"
              >
                Get Started Now
              </button>
            </Link>
          </div>
          
          {/* Decorative Doodles */}
          <div className="absolute bottom-4 right-4 text-amber-600 opacity-30">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Paper Clip Effect */}
      <div className="absolute top-20 right-1/4 w-12 h-24 transform rotate-12 opacity-80">
        <div className="w-full h-full rounded-tl-sm rounded-tr-sm rounded-bl-xl rounded-br-xl bg-gray-400 opacity-70"></div>
      </div>
    </div>
  );
};

export default Page;