'use client';
import Image from "next/image";
import { supabase } from "@/supabase-client";
import { useState, useEffect } from "react";

export default function Home() {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState([]);
  
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

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("list").insert([newTask]).single();

    if (error) {
      console.error("Error adding task: ", error.message);
    }
    setNewTask({ title: "", description: "" });
    
    // Refresh tasks after adding a new one
    fetchTasks();
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
                className="border border-gray-300 rounded-md p-4 bg-white shadow-sm"
              >
                <h3 className="font-medium text-lg">{task.title}</h3>
                <p className="text-gray-600 mt-1">{task.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}