'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import { useRouter } from "next/navigation";

export default function NewTask() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [session, setSession] = useState(null);
  const [convertedText, setConvertedText] = useState("");
  const [isConvertingText, setIsConvertingText] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
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
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setHasRecognitionSupport(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      console.error("No active session found");
      return;
    }
    
    const taskWithEmail = {
      ...newTask,
      email: session.user.email,
    };

    const { error } = await supabase.from("list").insert([taskWithEmail]);

    if (error) {
      console.error("Error adding task: ", error.message);
    } else {
      // Navigate back to main page after successful creation
      router.push('/main');
    }
  };
  
  // Speech recognition functionality
  const startListening = () => {
    if (isRecording) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setHasRecognitionSupport(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsRecording(true);
      setInterimTranscript("");
    };
    
    recognition.onresult = (event) => {
      let currentInterimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add final transcript to the description field
          setNewTask((prev) => ({
            ...prev,
            description: prev.description + (prev.description ? ' ' : '') + transcript.trim()
          }));
          setInterimTranscript("");
        } else {
          currentInterimTranscript += transcript;
        }
      }
      
      // Update the interim transcript
      setInterimTranscript(currentInterimTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setInterimTranscript("");
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      // If there's any interim text left when recording ends, add it to the description
      if (interimTranscript.trim()) {
        setNewTask((prev) => ({
          ...prev,
          description: prev.description + (prev.description ? ' ' : '') + interimTranscript.trim()
        }));
        setInterimTranscript("");
      }
    };
    
    recognition.start();
    
    // Store the recognition instance to stop it later
    window.recognitionInstance = recognition;
  };
  
  const stopListening = () => {
    if (window.recognitionInstance) {
      window.recognitionInstance.stop();
      setIsRecording(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear converted text when content changes
    if (name === "description" && convertedText) {
      setConvertedText("");
      setSelectedStyle("");
    }
  };

  const convertTextStyle = async (style) => {
    if (!newTask.description.trim()) {
      alert("Please add some content before converting the text style.");
      return;
    }
    
    setIsConvertingText(true);
    setSelectedStyle(style);
    
    try {
      // Call to your backend API that interfaces with text style converter
      const response = await fetch('/api/convert-text-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: newTask.description,
          style: style 
        }),
      });
      
      const data = await response.json();
      
      if (data.convertedText) {
        setConvertedText(data.convertedText);
      } else {
        throw new Error("Failed to convert text style");
      }
    } catch (error) {
      console.error("Error converting text style:", error);
      alert("Failed to convert text. Please try again.");
    } finally {
      setIsConvertingText(false);
    }
  };
  
  const applyConvertedText = () => {
    if (convertedText) {
      setNewTask(prev => ({
        ...prev,
        description: convertedText
      }));
      setConvertedText("");
      setSelectedStyle("");
    }
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
              <label htmlFor="description" className="block text-sm font-mono mb-1 text-amber-900 flex justify-between">
                <span>Content</span>
                {!hasRecognitionSupport && (
                  <span className="text-amber-600">Speech recognition not supported on this browser</span>
                )}
              </label>
              <div className="relative">
                <div className="w-full px-4 py-2 bg-amber-50 border-b-2 border-amber-700 focus-within:border-amber-800 transition-colors font-mono rounded-lg min-h-[200px]" style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px", lineHeight: "24px"}}>
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleChange}
                    className="w-full bg-transparent focus:outline-none resize-none"
                    rows="8"
                    placeholder="Write your note here or use voice input..."
                  />
                  {/* Show interim text while recording */}
                  {isRecording && interimTranscript && (
                    <span className="text-amber-600">{newTask.description ? ' ' : ''}{interimTranscript}</span>
                  )}
                </div>
                {hasRecognitionSupport && (
                  <button
                    type="button"
                    onClick={isRecording ? stopListening : startListening}
                    className={`absolute bottom-3 right-3 p-2.5 rounded-full ${
                      isRecording 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-amber-600 text-amber-100 hover:bg-amber-700'
                    }`}
                    title={isRecording ? "Stop recording" : "Start voice input"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isRecording ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      )}
                    </svg>
                  </button>
                )}
              </div>
              {isRecording && (
                <div className="mt-2 bg-red-50 text-red-600 p-2 rounded-lg font-mono text-sm flex items-center">
                  <span className="inline-block h-2 w-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                  Recording... Speak clearly into your microphone
                </div>
              )}
            </div>
            
            {/* Text Style Conversion Section */}
            <div className="border-t border-amber-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-mono text-amber-900">
                  Change Text Style
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => convertTextStyle("professional")}
                    disabled={isConvertingText || !newTask.description.trim()}
                    className={`px-3 py-1 text-sm rounded-lg font-mono transition ${
                      isConvertingText || !newTask.description.trim() 
                        ? 'bg-amber-200 text-amber-500 cursor-not-allowed' 
                        : 'bg-amber-600 text-amber-100 hover:bg-amber-700'
                    } ${selectedStyle === 'professional' ? 'ring-2 ring-amber-900' : ''}`}
                  >
                    Professional
                  </button>
                  <button
                    type="button"
                    onClick={() => convertTextStyle("friendly")}
                    disabled={isConvertingText || !newTask.description.trim()}
                    className={`px-3 py-1 text-sm rounded-lg font-mono transition ${
                      isConvertingText || !newTask.description.trim() 
                        ? 'bg-amber-200 text-amber-500 cursor-not-allowed' 
                        : 'bg-amber-600 text-amber-100 hover:bg-amber-700'
                    } ${selectedStyle === 'friendly' ? 'ring-2 ring-amber-900' : ''}`}
                  >
                    Friendly
                  </button>
                  <button
                    type="button"
                    onClick={() => convertTextStyle("casual")}
                    disabled={isConvertingText || !newTask.description.trim()}
                    className={`px-3 py-1 text-sm rounded-lg font-mono transition ${
                      isConvertingText || !newTask.description.trim() 
                        ? 'bg-amber-200 text-amber-500 cursor-not-allowed' 
                        : 'bg-amber-600 text-amber-100 hover:bg-amber-700'
                    } ${selectedStyle === 'casual' ? 'ring-2 ring-amber-900' : ''}`}
                  >
                    Casual
                  </button>
                </div>
              </div>
              
              <div className={`bg-amber-50 border-l-4 p-3 rounded-lg transition-all ${
                convertedText ? 'border-amber-600' : 'border-amber-200'
              }`}>
                {convertedText ? (
                  <div>
                    <p className="font-mono text-amber-900 mb-2">{convertedText}</p>
                    <button
                      type="button"
                      onClick={applyConvertedText}
                      className="px-3 py-1 text-sm rounded-lg font-mono bg-amber-600 text-amber-100 hover:bg-amber-700"
                    >
                      Apply Changes
                    </button>
                  </div>
                ) : (
                  <p className="text-amber-500 italic font-mono text-sm">
                    {isConvertingText 
                      ? "Converting your text..." 
                      : "Select a style to convert your note to professional, friendly, or casual tone."}
                  </p>
                )}
              </div>
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
