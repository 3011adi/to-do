'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import Link from "next/link";
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [session, setSession] = useState(null);
  const [userOrg, setUserOrg] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);

  // Fetch user's organization name
  const fetchUserOrg = async (email) => {
    if (!email) return null;
    
    try {
      const { data, error } = await supabase
        .from("user")
        .select("name")
        .eq("email", email)
        .single();
        
      if (error) {
        console.error("Error fetching user organization:", error.message);
        return null;
      }
      
      return data?.name || null;
    } catch (err) {
      console.error("Unexpected error:", err);
      return null;
    }
  };
  
  const fetchTasks = async () => {
    if (!session?.user?.email || !userOrg) {
      setTasks([]);
      return;
    }
    
    try {
      // Get all users in this organization
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from("user")
        .select("email")
        .eq("name", userOrg);
        
      if (orgUsersError) {
        console.error("Error fetching organization users:", orgUsersError.message);
        return;
      }
      
      const orgEmails = orgUsers.map(user => user.email);
      
      // Get tasks for all users in this organization
      const { data: taskData, error: taskError } = await supabase
        .from("list")
        .select("*")
        .in("email", orgEmails)
        .order("created_at", { ascending: true });

      if (taskError) {
        console.error("Error fetching tasks:", taskError.message);
        return;
      }
      
      setTasks(taskData);
      console.log("Fetched tasks for organization:", taskData);
    } catch (err) {
      console.error("Unexpected error: ", err);
    }
  };

  // Fetch organization members
  const fetchOrgMembers = async () => {
    if (!userOrg) return;
    
    try {
      const { data, error } = await supabase
        .from("user")
        .select("email, name")
        .eq("name", userOrg);
        
      if (error) {
        console.error("Error fetching organization members:", error.message);
        return;
      }
      
      setOrgMembers(data || []);
    } catch (err) {
      console.error("Unexpected error fetching members:", err);
    }
  };

  // Start editing a task
  const handleEditStart = (task) => {
    setEditingTaskId(task.id);
    setEditFormData({ title: task.title, description: task.description });
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Update task in database
  const handleUpdate = async (id) => {
    try {
      const { error } = await supabase
        .from("list")
        .update(editFormData)
        .eq("id", id);
      
      if (error) {
        console.error("Error updating task:", error.message);
        return;
      }
      
      // Exit edit mode and refresh tasks
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      console.error("Unexpected error during update:", err);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingTaskId(null);
  };

  // Process task data for chart visualization
  const processChartData = () => {
    if (!tasks || tasks.length === 0) {
      setChartData(null);
      return;
    }

    // Sort tasks by creation date
    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Extract dates and create task count by date
    const dates = {};
    sortedTasks.forEach(task => {
      // Format date as YYYY-MM-DD
      const dateStr = new Date(task.created_at).toISOString().split('T')[0];
      
      if (!dates[dateStr]) {
        dates[dateStr] = 0;
      }
      dates[dateStr] += 1;
    });

    // Prepare chart data
    const chartData = {
      labels: Object.keys(dates),
      datasets: [
        {
          label: 'Notes Created',
          data: Object.values(dates),
          backgroundColor: 'rgba(180, 83, 9, 0.6)',
          borderColor: 'rgba(146, 64, 14, 1)',
          borderWidth: 2,
          borderRadius: 4,
        }
      ],
    };
    
    setChartData(chartData);
  };
  
  // Update chart data when tasks change
  useEffect(() => {
    processChartData();
  }, [tasks]);

  // Fetch tasks and session when component mounts
  useEffect(() => {
    const getSessionAndUserData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        
        // Get user's organization
        const orgName = await fetchUserOrg(session.user.email);
        setUserOrg(orgName);
      }
    };
    
    getSessionAndUserData();
  }, []);
  
  // When userOrg changes, fetch tasks and members
  useEffect(() => {
    if (userOrg) {
      fetchTasks();
      fetchOrgMembers();
    }
  }, [userOrg]);

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("list")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting task:", error.message);
        return;
      }
      
      // Refresh tasks after deletion
      fetchTasks();
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
    }
  };
  
  const generateAISummary = async () => {
    if (tasks.length === 0) {
      alert("No notes available to summarize.");
      return;
    }
    
    setIsGeneratingSummary(true);
    
    try {
      // Prepare text from all notes
      const allNotesText = tasks.map(task => 
        `Note: ${task.title}\n${task.description}`
      ).join("\n\n");
      
      // Send to our AI summary endpoint
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: `Summarize these notes collectively:\n${allNotesText}` 
        }),
      });
      
      const data = await response.json();
      
      if (data.summary) {
        setAiSummary(data.summary);
      } else {
        throw new Error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Error generating collective summary:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  return (
    <div className="bg-amber-50 min-h-screen p-4" style={{backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEGSURBVGhD7ZdBCsIwFEXTrrrXLQii4LLc/8YFqdZf6DiIQvO/9cDblCTtgZtpm/Sqqqqqqqqqqqo3zuPiG3SZX16XWdgZdJEXkXdEFMaJ9tZyMhRTOOmg5yCyQB+JLBipSAuO37xyJsPZI18R4YwsgJeRwXCqLzPy3N8+LlsYCqeGYiMX3sOlJ2ZGhpdmRkQBGrEMIgvQiJURUYBGLI2IAjRibUQUoBEfIy5yJMST6Dvzw3GQzciNJX1RjCXfkQcHr2oN+0wZE+B2aLDQjBg42IoYDG0NDBiL5FcZ5LHJuMvQQNKTMNpEyTvQOZgUGRmv+jTkXwVEFnBHRJHHicDhExBZQFVVVVVVVVW9KaVe9/iBnV2iJ3IAAAAASUVORK5CYII=')", backgroundRepeat: "repeat"}}>
      <div className="max-w-7xl mx-auto">
        {/* Responsive Navbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-amber-900 p-4 rounded-xl border-l-8 border-amber-700 shadow-md">
          <h1 className="text-xl sm:text-2xl font-mono text-amber-100 mb-3 sm:mb-0">Task Notebook</h1>
          
          {session?.user?.email && (
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
              <div className="flex items-center">
                <span className="font-mono text-amber-200 text-sm truncate max-w-[180px] sm:max-w-none">
                  {session.user.email}
                </span>
                {userOrg && (
                  <span className="ml-2 bg-amber-800 text-amber-100 px-2 py-0.5 rounded-lg text-xs border border-amber-600">
                    {userOrg}
                  </span>
                )}
              </div>
              <Link href="/main/organizations">
                <button className="bg-amber-700 hover:bg-amber-800 text-amber-100 px-3 py-1.5 rounded-lg border border-amber-600 font-mono text-xs sm:text-sm transition shadow-sm w-full sm:w-auto">
                  Organizations
                </button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Notes Activity and Org Stats Section */}
        {chartData && tasks.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Notes Activity Chart - Now takes 2 columns */}
            <div className="md:col-span-2 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
              <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
                <h2 className="text-xl">Notes Activity</h2>
              </div>
              <div className="p-6 bg-amber-50">
                <div className="h-64 w-full">
                  <Bar 
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            font: {
                              family: 'monospace'
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: 'Notes Created Over Time',
                          font: {
                            family: 'monospace',
                            size: 16
                          }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                            font: {
                              family: 'monospace'
                            }
                          },
                          title: {
                            display: true,
                            text: 'Number of Notes',
                            font: {
                              family: 'monospace'
                            }
                          }
                        },
                        x: {
                          ticks: {
                            font: {
                              family: 'monospace'
                            }
                          },
                          title: {
                            display: true,
                            text: 'Date Created',
                            font: {
                              family: 'monospace'
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Organization Stats - Takes 1 column */}
            <div className="md:col-span-1 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
              <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
                <h2 className="text-xl">Organization Stats</h2>
              </div>
              <div className="p-6 bg-amber-50">
                <div className="bg-amber-100/60 p-4 rounded-lg border-l-4 border-amber-600 font-mono">
                  <div className="space-y-4">
                    {/* Org Name */}
                    <div>
                      <h3 className="text-amber-900 font-bold text-lg border-b border-amber-300 pb-1">
                        {userOrg || "No Organization"}
                      </h3>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-amber-200/60 p-3 rounded-lg">
                        <p className="text-lg font-bold text-amber-800">{tasks.length}</p>
                        <p className="text-sm text-amber-700">Notes</p>
                      </div>
                      <div className="bg-amber-200/60 p-3 rounded-lg">
                        <p className="text-lg font-bold text-amber-800">{orgMembers.length}</p>
                        <p className="text-sm text-amber-700">Members</p>
                      </div>
                    </div>
                    
                    {/* Member List */}
                    <div>
                      <h4 className="font-bold text-amber-800 border-b border-amber-300 pb-1 mb-2">
                        Team Members
                      </h4>
                      {orgMembers.length > 0 ? (
                        <ul className="max-h-[200px] overflow-y-auto pr-2">
                          {orgMembers.map((member, index) => (
                            <li key={index} className="flex items-center py-1 border-b border-amber-200 last:border-b-0">
                              <span className="bg-amber-700 text-amber-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                                {member.email.substring(0, 1).toUpperCase()}
                              </span>
                              <span className="text-amber-800 text-sm truncate">{member.email}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-amber-700 text-sm italic">No members found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Summary Section - Now takes 1 column on desktop */}
          <div className="md:col-span-1 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono flex justify-between items-center">
              <h2 className="text-xl">AI Summary</h2>
              <button 
                onClick={generateAISummary}
                disabled={isGeneratingSummary || tasks.length === 0}
                className={`px-4 py-2 rounded-lg font-mono ${
                  isGeneratingSummary || tasks.length === 0 
                    ? 'bg-amber-600/50 cursor-not-allowed' 
                    : 'bg-amber-700 hover:bg-amber-800 border border-amber-900'
                } transition`}
              >
                {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
            
            <div className="p-6" style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px"}}>
              {aiSummary ? (
                <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600 font-mono">
                  <h3 className="font-bold mb-2 text-amber-900">AI-Generated Overview:</h3>
                  <p className="text-amber-800 whitespace-pre-line">{aiSummary}</p>
                </div>
              ) : (
                <div className="text-center py-4 font-mono text-amber-700">
                  {isGeneratingSummary ? (
                    <p>Analyzing all your notes...</p>
                  ) : (
                    <p>Generate an AI summary to get an overview of all your notes</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Task List - Now takes 2 columns on desktop */}
          <div className="md:col-span-2 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono flex justify-between items-center">
              <h2 className="text-xl">
                {userOrg ? `${userOrg} Notes` : 'Notes'} 
                <span className="text-amber-200 text-sm ml-2">({tasks.length})</span>
              </h2>
              <Link href="/main/new">
                <button className="bg-amber-700 text-amber-100 py-2 px-4 rounded-lg border border-amber-900 hover:bg-amber-800 transition shadow-sm font-mono">
                  + New Note
                </button>
              </Link>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{
              backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", 
              backgroundSize: "100% 24px",
              maxHeight: "500px"
            }}>
              {!userOrg ? (
                <div className="text-center py-8 font-mono text-amber-800">
                  <p>No organization found for your account.</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 font-mono text-amber-800">
                  <p>No notes found for your organization.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {tasks.map((task) => (
                    <li key={task.id} className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-600 shadow">
                      {editingTaskId === task.id ? (
                        <div className="bg-amber-100 p-4 rounded-lg border border-amber-600">
                          <input
                            type="text"
                            name="title"
                            value={editFormData.title}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 mb-2 bg-amber-50 border-b-2 border-amber-700 focus:border-amber-800 focus:outline-none font-mono rounded-lg"
                          />
                          <textarea
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditChange}
                            className="w-full px-4 py-2 mb-4 bg-amber-50 border-b-2 border-amber-700 focus:border-amber-800 focus:outline-none font-mono rounded-lg"
                            rows="3"
                            style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px", lineHeight: "24px"}}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleEditCancel}
                              className="px-4 py-2 text-amber-900 border border-amber-700 hover:bg-amber-200 rounded-lg transition font-mono"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(task.id)}
                              className="px-4 py-2 bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-800 transition shadow border border-amber-900 font-mono"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="pr-4 font-mono" style={{lineHeight: "24px"}}>
                            <h3 className="font-bold text-lg text-amber-900 border-b border-amber-300 pb-1">{task.title}</h3>
                            <p className="text-amber-800 mt-2 whitespace-pre-line">{task.description}</p>
                            <p className="text-xs text-amber-700 mt-2 italic">Added by: {task.email}</p>
                          </div>
                          <div className="flex space-x-2 items-start">
                            <button
                              onClick={() => handleEditStart(task)}
                              className="p-2 text-amber-800 hover:bg-amber-200 rounded-lg transition"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-2 text-amber-800 hover:bg-amber-200 rounded-lg transition"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}