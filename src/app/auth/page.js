'use client';
import React, { useState } from 'react';
import { supabase } from "@/supabase-client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (isSignUp) {
      // Sign up with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Error signing up:", signUpError.message);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Insert user data into the `user` table
      const { error: insertError } = await supabase.from('user').insert([
        { email, name }
      ]);

      if (insertError) {
        console.error("Error inserting user data:", insertError.message);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      console.log("Sign-up successful and user data inserted!");
      router.push('/main');
    } else {
      // Sign in with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Error signing in:", signInError.message);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      console.log("Sign-in successful!");
      router.push('/main');
    }
    
    setLoading(false);
  };

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
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-extrabold mb-3 text-amber-900 font-mono relative inline-block">
              {isSignUp ? 'Join Notebook' : 'Welcome Back'}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-amber-600"></div>
            </h1>
            <p className="text-amber-700 font-mono mt-4">
              {isSignUp ? 'Create your account today' : 'Sign in to your notebook'}
            </p>
          </div>
          
          {/* Notebook Tab */}
          <div className="absolute -right-1 top-12 bg-amber-700 px-4 py-2 text-amber-50 font-mono transform -rotate-90 origin-bottom-right">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 font-mono">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <form className="space-y-4 font-mono" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm text-amber-800 mb-1">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-md block w-full px-3 py-2 border border-amber-300 placeholder-amber-400 text-amber-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-amber-50 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm text-amber-800 mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md block w-full px-3 py-2 border border-amber-300 placeholder-amber-400 text-amber-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-amber-50 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-amber-800 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="appearance-none rounded-md block w-full px-3 py-2 border border-amber-300 placeholder-amber-400 text-amber-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-amber-50 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border-2 border-amber-800 text-sm font-bold rounded-md text-amber-50 ${
                  loading 
                    ? 'bg-amber-500 cursor-not-allowed' 
                    : 'bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 transform hover:-translate-y-1 shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-amber-700">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-amber-900 hover:text-amber-800 focus:outline-none underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="inline-block text-sm text-amber-700 hover:text-amber-900 hover:underline">
              ← Back to home
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
      <div className="absolute top-20 right-1/4 w-8 h-16 transform rotate-12 opacity-80">
        <div className="w-full h-full rounded-tl-sm rounded-tr-sm rounded-bl-xl rounded-br-xl bg-gray-400 opacity-70"></div>
      </div>
    </div>
  );
};

export default Auth;