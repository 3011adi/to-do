'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/supabase-client";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function OrganizationWall() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userOrg, setUserOrg] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
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
        
        // Auto-select user's org if available, otherwise first org
        if (orgsWithMetadata.length > 0) {
          const userOrgData = orgsWithMetadata.find(org => org.isCurrentUserOrg);
          const orgToSelect = userOrgData || orgsWithMetadata[0];
          handleOrgClick(orgToSelect.name);
        }
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
    setSelectedOrg(orgName);
    
    // Only fetch details if not already loaded
    if (!orgDetails[orgName]) {
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
    }
  };

  // Format chart data for the organization
  const formatChartData = (orgName) => {
    if (!orgDetails[orgName]) return [];
    
    // Prepare data for the charts
    const memberData = orgDetails[orgName].map(member => ({
      name: member.email.split('@')[0],
      notes: member.notes.length,
    }));
    
    return memberData;
  };

  // Get colors for pie chart
  const COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'];

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
              Back 
            </button>
          </Link>
        </div>
        
        {/* Main Content - Split Layout */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Side - Organization List */}
          <div className="md:w-1/3 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden">
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
              <h2 className="text-xl">Organizations</h2>
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
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {organizations.map((org) => (
                    <div 
                      key={org.name}
                      onClick={() => handleOrgClick(org.name)}
                      className={`p-3 rounded-lg shadow-md border-l-4 cursor-pointer hover:bg-amber-100 transition duration-200 ${
                        selectedOrg === org.name 
                          ? 'border-amber-600 bg-amber-200' 
                          : org.isCurrentUserOrg 
                            ? 'border-amber-600 bg-amber-50' 
                            : 'border-amber-400 bg-amber-50/70'
                      }`}
                    >
                      <h3 className="font-bold text-amber-900 font-mono flex items-center justify-between">
                        {org.name}
                        {org.isCurrentUserOrg && (
                          <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full ml-2">
                            Your Org
                          </span>
                        )}
                      </h3>
                      <div className="mt-1 font-mono text-sm">
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
          
          {/* Right Side - Selected Organization Details and Charts */}
          <div className="md:w-2/3 bg-amber-100 rounded-xl border-l-4 border-amber-700 shadow-md overflow-hidden flex flex-col">
            <div className="p-4 bg-amber-800 text-amber-100 border-b border-amber-900 font-mono">
              <h2 className="text-xl">
                {selectedOrg ? `${selectedOrg} Overview` : 'Organization Details'}
              </h2>
            </div>
            
            <div className="p-4 flex-1 flex flex-col" style={{
              backgroundImage: "linear-gradient(to bottom, rgba(245, 158, 11, 0.05) 1px, transparent 1px)", 
              backgroundSize: "100% 24px"
            }}>
              {!selectedOrg ? (
                <div className="text-center py-8 font-mono text-amber-800">
                  <p>Select an organization to view details</p>
                </div>
              ) : loadingDetails ? (
                <div className="text-center py-8 font-mono text-amber-800">
                  <p>Loading organization details...</p>
                </div>
              ) : orgDetails[selectedOrg]?.length > 0 ? (
                <div className="h-full flex flex-col md:flex-row">
                  {/* Member List Section - Left Side */}
                  <div className="md:w-1/2 p-2 overflow-y-auto max-h-[600px]">
                    <h3 className="font-bold text-amber-900 pb-2 mb-3 border-b border-amber-300 font-mono">
                      Members ({orgDetails[selectedOrg].length})
                    </h3>
                    <div className="space-y-3">
                      {orgDetails[selectedOrg].map(member => (
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
                  </div>
                  
                  {/* Charts Section - Right Side */}
                  <div className="md:w-1/2 p-2">
                    <h3 className="font-bold text-amber-900 pb-2 mb-3 border-b border-amber-300 font-mono">
                      Analytics
                    </h3>
                    
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm mb-4">
                      <h5 className="text-sm font-medium text-amber-800 mb-2 font-mono">Notes Per Member</h5>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={formatChartData(selectedOrg)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} />
                            <Tooltip 
                              contentStyle={{backgroundColor: '#fffbeb', borderColor: '#d97706'}}
                              labelStyle={{color: '#92400e'}}
                            />
                            <Legend wrapperStyle={{fontSize: 10, fontFamily: 'monospace'}} />
                            <Bar dataKey="notes" name="Notes" fill="#d97706" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Task Distribution Pie Chart */}
                    {orgDetails[selectedOrg].some(member => member.notes.length > 0) && (
                      <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                        <h5 className="text-sm font-medium text-amber-800 mb-2 font-mono">Notes Distribution</h5>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={formatChartData(selectedOrg)}
                                dataKey="notes"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {formatChartData(selectedOrg).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [`${value} notes`, 'Count']}
                                contentStyle={{backgroundColor: '#fffbeb', borderColor: '#d97706'}}
                                labelStyle={{color: '#92400e'}}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 font-mono text-amber-800">
                  <p>No members found for this organization.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}