'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";

export default function Home() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [session, setSession] = useState(null);
  const [userOrg, setUserOrg] = useState(null);
  
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
  
  // When userOrg changes, fetch tasks
  useEffect(() => {
    if (userOrg) {
      fetchTasks();
    }
  }, [userOrg]);

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

    const { error } = await supabase.from("list").insert([taskWithEmail]).single();

    if (error) {
      console.error("Error adding task: ", error.message);
    }
    setNewTask({ title: "", description: "" });
    
    // Refresh tasks after adding a new one
    fetchTasks();
  };

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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="bg-amber-50 min-h-screen p-4" style={{backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEGSURBVGhD7ZdBCsIwFEXTrrrXLQii4LLc/8YFqdZf6DiIQvO/9cDblCTtgZtpm/Sqqqqqqqqqqqo3zuPiG3SZX16XWdgZdJEXkXdEFMaJ9tZyMhRTOOmg5yCyQB+JLBipSAuO37xyJsPZI18R4YwsgJeRwXCqLzPy3N8+LlsYCqeGYiMX3sOlJ2ZGhpdmRkQBGrEMIgvQiJURUYBGLI2IAjRibUQUoBEfIy5yJMST6Dvzw3GQzciNJX1RjCXfkQcHr2oN+0wZE+B2aLDQjBg42IoYDG0NDBiL5FcZ5LHJuMvQQNKTMNpEyTvQOZgUGRmv+jTkXwVEFnBHRJHHicDhExBZQFVVVVVVVVW9KaVe9/iBnV2iJ3IAAAAASUVORK5CYII=')", backgroundRepeat: "repeat"}}>
      <div className="max-w-7xl mx-auto">
        {/* Notebook-style header */}
        <div className="flex items-center justify-between mb-6 bg-amber-900 p-4 rounded-xl border-l-8 border-amber-700 shadow-md">
          <h1 className="text-2xl font-mono text-amber-100">Task Notebook</h1>
          
          {session?.user?.email && (
            <div className="text-right">
              <p className="text-sm font-mono text-amber-200">
                <span className="font-medium">{session.user.email}</span>
                {userOrg && (
                  <span className="ml-2 bg-amber-800 text-amber-100 px-2 py-1 rounded-lg text-xs border border-amber-600">
                    {userOrg}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Task Form - Left Column */}
          <div className="bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden" style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px"}}>
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
              <h2 className="text-xl">New Note</h2>
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
                  rows="6"
                  placeholder="Write your note here..."
                  style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px", lineHeight: "24px"}}
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-amber-700 text-amber-100 py-3 px-4 rounded-lg border border-amber-900 hover:bg-amber-800 transition shadow-md font-mono"
              >
                Add Note
              </button>
            </form>
          </div>
          
          {/* Task List - Right Column */}
          <div className="bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
              <h2 className="text-xl">
                {userOrg ? `${userOrg} Notes` : 'Notes'}
              </h2>
            </div>
            
            <div className="p-4" style={{backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", backgroundSize: "100% 24px"}}>
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