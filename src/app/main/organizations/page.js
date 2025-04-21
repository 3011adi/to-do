'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import Link from "next/link";

export default function OrganizationWall() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userOrg, setUserOrg] = useState(null);
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Handle organization click
  const handleOrgClick = async (orgName) => {
    // Toggle expanded state
    if (expandedOrg === orgName) {
      setExpandedOrg(null);
      return;
    }
    
    setExpandedOrg(orgName);
    setLoadingDetails(true);
    
    try {
      // Fetch organization members
      const { data: members, error: membersError } = await supabase
        .from("user")
        .select("email, name")
        .eq("name", orgName);
        
      if (membersError) {
        console.error("Error fetching organization members:", membersError.message);
        return;
      }
      
      // Fetch notes for each member
      const memberDetails = await Promise.all(members.map(async (member) => {
        const { data: notes, error: notesError } = await supabase
          .from("list")
          .select("id, title, created_at")
          .eq("email", member.email)
          .order("created_at", { ascending: false });
          
        return {
          email: member.email,
          notes: notes || []
        };
      }));
      
      setOrgDetails({
        ...orgDetails,
        [orgName]: memberDetails
      });
    } catch (err) {
      console.error("Error fetching organization details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

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
                  <div key={org.name} className="flex flex-col">
                    <div 
                      onClick={() => handleOrgClick(org.name)}
                      className={`p-4 rounded-lg shadow-md border-l-4 ${
                        org.isCurrentUserOrg ? 'border-amber-600 bg-amber-50' : 'border-amber-400 bg-amber-50/70'
                      } cursor-pointer hover:bg-amber-100 transition duration-200 mb-1`}
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
                      <div className="mt-2 text-amber-800 text-xs text-right italic">
                        Click to {expandedOrg === org.name ? 'hide' : 'show'} details
                      </div>
                    </div>
                    
                    {/* Expanded organization details */}
                    {expandedOrg === org.name && (
                      <div className="bg-amber-50 p-3 rounded-lg shadow border border-amber-300 mb-4 overflow-y-auto max-h-80">
                        <h4 className="font-bold text-amber-900 border-b border-amber-300 pb-1 mb-2 font-mono">
                          {org.name} - Member Details
                        </h4>
                        
                        {loadingDetails ? (
                          <div className="text-center py-4 text-amber-800 font-mono text-sm">
                            <p>Loading organization details...</p>
                          </div>
                        ) : orgDetails[org.name]?.length > 0 ? (
                          <div className="space-y-3">
                            {orgDetails[org.name].map(member => (
                              <div key={member.email} className="bg-amber-100/50 p-2 rounded border-l-2 border-amber-500">
                                <p className="font-mono text-sm font-medium text-amber-900">{member.email}</p>
                                {member.notes.length > 0 ? (
                                  <div className="mt-1 ml-2">
                                    <p className="text-xs font-mono text-amber-700 mb-1">{member.notes.length} notes:</p>
                                    <ul className="list-disc list-inside">
                                      {member.notes.slice(0, 3).map(note => (
                                        <li key={note.id} className="text-xs font-mono text-amber-800 truncate">
                                          {note.title}
                                        </li>
                                      ))}
                                      {member.notes.length > 3 && (
                                        <li className="text-xs font-mono text-amber-700 italic">
                                          +{member.notes.length - 3} more notes...
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs font-mono text-amber-700 mt-1 ml-2 italic">No notes</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-amber-800 font-mono text-sm">
                            <p>No members found for this organization.</p>
                          </div>
                        )}
                      </div>
                    )}
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
