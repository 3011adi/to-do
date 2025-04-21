'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";

export default function NewTask() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
      } else {
        router.push('/'); // Redirect to login if no session
      }
    };
    
    getSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      console.error("No active session found");
      return;
    }
    
    const taskWithEmail = {
      ...newTask,
      email: session.user.email
    };

    const { error } = await supabase.from("list").insert([taskWithEmail]);

    if (error) {
      console.error("Error adding task: ", error.message);
    } else {
      // Navigate back to main page after successful creation
      router.push('/main');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="bg-amber-50 min-h-screen p-4" style={{backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEGSURBVGhD7ZdBCsIwFEXTrrrXLQii4LLc/8YFqdZf6DiIQvO/9cDblCTtgZtpm/Sqqqqqqqqqqqo3zuPiG3SZX16XWdgZdJEXkXdEFMaJ9tZyMhRTOOmg5yCyQB+JLBipSAuO37xyJsPZI18R4YwsgJeRwXCqLzPy3N8+LlsYCqeGYiMX3sOlJ2ZGhpdmRkQBGrEMIgvQiJURUYBGLI2IAjRibUQUoBEfIy5yJMST6Dvzw3GQzciNJX1RjCXfkQcHr2oN+0wZE+B2aLDQjBg42IoYDG0NDBiL5FcZ5LHJuMvQQNKTMNpEyTvQOZgUGRmv+jTkXwVEFnBHRJHHicDhExBZQFVVVVVVVVW9KaVe9/iBnV2iJ3IAAAAASUVORK5CYII=')", backgroundRepeat: "repeat"}}>
      <div className="max-w-4xl mx-auto">
        {/* Notebook-style header */}
        <div className="flex items-center justify-between mb-6 bg-amber-900 p-4 rounded-xl border-l-8 border-amber-700 shadow-md">
          <h1 className="text-2xl font-mono text-amber-100">New Note</h1>
          
          {session?.user?.email && (
            <div className="text-right">
              <p className="text-sm font-mono text-amber-200">
                <span className="font-medium">{session.user.email}</span>
              </p>
            </div>
          )}
        </div>
        
        {/* Form Container */}
        <div className="bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden" style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px"}}>
          <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono flex justify-between items-center">
            <h2 className="text-xl">Create New Note</h2>
            <button 
              onClick={() => router.back()}
              className="text-amber-200 hover:text-amber-100 underline font-mono"
            >
              Back to Notes
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-mono mb-1 text-amber-900">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-amber-50 border-b-2 border-amber-700 focus:border-amber-800 focus:outline-none transition-colors font-mono rounded-lg"
                placeholder="Note title..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-mono mb-1 text-amber-900">
                Content
              </label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-amber-50 border-b-2 border-amber-700 focus:border-amber-800 focus:outline-none transition-colors font-mono rounded-lg"
                rows="10"
                placeholder="Write your note here..."
                style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px", lineHeight: "24px"}}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-amber-200 text-amber-900 py-3 px-4 rounded-lg border border-amber-700 hover:bg-amber-300 transition shadow-md font-mono"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="flex-1 bg-amber-700 text-amber-100 py-3 px-4 rounded-lg border border-amber-900 hover:bg-amber-800 transition shadow-md font-mono"
              >
                Add Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
