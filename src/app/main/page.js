'use client';
import Image from "next/image";
import { supabase } from "@/supabase-client";
import { useState, useEffect } from "react";
import {Session} from "@supabase/supabase-js"

export default function Home() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [session, setSession] = useState(null);
  
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("list")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error reading tasks: ", error.message);
        return;
      }

      setTasks(data);
      console.log("Fetched tasks:", data); // Log tasks to console
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
    // Get the session
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
      }
    };
    
    getSession();
    fetchTasks();
  }, []);

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
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Task Manager</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={newTask.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={newTask.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="3"
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Add Task
        </button>
      </form>
      
      {/* Task List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet. Add one above!</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="border border-gray-300 rounded-md p-4 bg-white shadow-sm flex justify-between items-start"
              >
                {editingTaskId === task.id ? (
                  <div className="w-full">
                    <input
                      type="text"
                      name="title"
                      value={editFormData.title}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    />
                    <textarea
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                      rows="3"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleUpdate(task.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className="font-medium text-lg">{task.title}</h3>
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStart(task)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 text-sm"
                      >
                        Delete
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
  );
}