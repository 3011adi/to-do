'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import Link from "next/link";

export default function OrganizationWall() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userOrg, setUserOrg] = useState(null);

  // Fetch user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        
        // Get user's organization
        const orgName = await fetchUserOrg(session.user.email);
        setUserOrg(orgName);
      }
    };
    
    getSession();
  }, []);

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

  // Fetch all organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from("user")
          .select("name")
          .not('name', 'is', null)
          
        if (error) {
          console.error("Error fetching organizations:", error.message);
          return;
        }
        
        // Extract unique organization names
        const uniqueOrgs = [...new Set(data.map(item => item.name))];
        
        // Format the organizations with additional metadata
        const orgsWithMetadata = await Promise.all(uniqueOrgs.map(async (orgName) => {
          // Count members in this organization
          const { data: members, error: membersError } = await supabase
            .from("user")
            .select("email")
            .eq("name", orgName);
            
          // Count tasks in this organization
          const { data: tasks, error: tasksError } = await supabase
            .from("list")
            .select("id")
            .in("email", members?.map(m => m.email) || []);
            
          return {
            name: orgName,
            memberCount: members?.length || 0,
            taskCount: tasks?.length || 0,
            isCurrentUserOrg: orgName === userOrg
          };
        }));
        
        setOrganizations(orgsWithMetadata);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchOrganizations();
    }
  }, [session, userOrg]);

  return (
    <div className="bg-amber-50 min-h-screen p-4" style={{backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEGSURBVGhD7ZdBCsIwFEXTrrrXLQii4LLc/8YFqdZf6DiIQvO/9cDblCTtgZtpm/Sqqqqqqqqqqqo3zuPiG3SZX16XWdgZdJEXkXdEFMaJ9tZyMhRTOOmg5yCyQB+JLBipSAuO37xyJsPZI18R4YwsgJeRwXCqLzPy3N8+LlsYCqeGYiMX3sOlJ2ZGhpdmRkQBGrEMIgvQiJURUYBGLI2IAjRibUQUoBEfIy5yJMST6Dvzw3GQzciNJX1RjCXfkQcHr2oN+0wZE+B2aLDQjBg42IoYDG0NDBiL5FcZ5LHJuMvQQNKTMNpEyTvQOZgUGRmv+jTkXwVEFnBHRJHHicDhExBZQFVVVVVVVVW9KaVe9/iBnV2iJ3IAAAAASUVORK5CYII=')", backgroundRepeat: "repeat"}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-amber-900 p-4 rounded-xl border-l-8 border-amber-700 shadow-md">
          <div className="flex items-center">
            <h1 className="text-2xl font-mono text-amber-100">Organizations</h1>
          </div>
          <Link href="/main">
            <button className="bg-amber-700 hover:bg-amber-800 text-amber-100 px-4 py-2 rounded-lg border border-amber-600 font-mono transition shadow-sm">
              Back to Notes
            </button>
          </Link>
        </div>
        
        {/* Organization List */}
        <div className="bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
          <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
            <h2 className="text-xl">All Organizations</h2>
          </div>
          
          <div className="p-4" style={{
            backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", 
            backgroundSize: "100% 24px"
          }}>
            {loading ? (
              <div className="text-center py-8 font-mono text-amber-800">
                <p>Loading organizations...</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 font-mono text-amber-800">
                <p>No organizations found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => (
                  <div 
                    key={org.name} 
                    className={`p-4 rounded-lg shadow-md border-l-4 ${
                      org.isCurrentUserOrg ? 'border-amber-600 bg-amber-50' : 'border-amber-400 bg-amber-50/70'
                    }`}
                  >
                    <h3 className="font-bold text-lg text-amber-900 font-mono flex items-center justify-between">
                      {org.name}
                      {org.isCurrentUserOrg && (
                        <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full ml-2">
                          Your Org
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 font-mono text-sm">
                      <p className="text-amber-800">
                        <span className="font-medium">Members:</span> {org.memberCount}
                      </p>
                      <p className="text-amber-800">
                        <span className="font-medium">Notes:</span> {org.taskCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
