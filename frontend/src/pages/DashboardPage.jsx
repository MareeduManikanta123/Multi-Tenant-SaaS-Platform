import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { tenantService, projectService, taskService } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
  });
  const [allTenants, setAllTenants] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Super Admin: Load all tenants and all projects
        if (user?.role === 'super_admin') {
          try {
            const tenantsRes = await tenantService.listTenants({ limit: 100 });
            const tenantsData = Array.isArray(tenantsRes.data.data) 
              ? tenantsRes.data.data 
              : (tenantsRes.data.data && Array.isArray(tenantsRes.data.data.tenants) 
                ? tenantsRes.data.data.tenants 
                : []);
            setAllTenants(tenantsData);

            // Load all projects across all tenants
            const projectsRes = await projectService.listProjects({ limit: 50, page: 1 });
            setAllProjects(projectsRes.data.data || []);
          } catch (err) {
            console.error('Error loading tenants:', err);
            setAllTenants([]);
            setAllProjects([]);
          }
        }
        // Tenant Admin & User: Load tenant stats and projects
        else if (user?.tenantId) {
          const tenantRes = await tenantService.getTenant(user.tenantId);
          const tenantData = tenantRes.data.data;
          setStats({
            totalUsers: tenantData.totalUsers || 0,
            totalProjects: tenantData.totalProjects || 0,
            totalTasks: tenantData.totalTasks || 0,
          });

          // Load recent projects
          const projectsRes = await projectService.listProjects({
            page: 1,
            limit: 5,
          });
          setRecentProjects(projectsRes.data.data || []);

          // For regular users, load their assigned tasks
          if (user?.role === 'user') {
            try {
              // Get all projects and their tasks to find assigned ones
              const allProjectsRes = await projectService.listProjects({ limit: 100 });
              const projects = allProjectsRes.data.data || [];
              let userTasks = [];
              for (const proj of projects) {
                try {
                  const tasksRes = await taskService.listTasks(proj.id, { limit: 50 });
                  const projTasks = (tasksRes.data.data || []).filter(
                    t => t.assignedTo === user.id && t.status !== 'completed'
                  );
                  userTasks = [...userTasks, ...projTasks];
                } catch (e) {
                  // Skip if unable to load tasks
                }
              }
              setMyTasks(userTasks);
            } catch (err) {
              console.error('Error loading user tasks:', err);
              setMyTasks([]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // SUPER ADMIN DASHBOARD - View all tenants
  if (user?.role === 'super_admin') {
    // Create a map of tenantId -> tenant for easy lookup
    const tenantMap = {};
    allTenants.forEach(t => {
      tenantMap[t.id] = t;
    });

    return (
      <div className="container-main">
        <h1 className="text-4xl font-bold mb-2">System Administration</h1>
        <p className="text-gray-600 mb-8">Manage all tenants and monitor platform health</p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* All Tenants Section */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6">All Tenants</h2>
          {allTenants.length === 0 ? (
            <p className="text-gray-600">No tenants yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Tenant Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Subdomain</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Plan</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Users</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Projects</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {allTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-semibold">{tenant.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{tenant.subdomain}</td>
                      <td className="border border-gray-300 px-4 py-2 capitalize">{tenant.subscriptionPlan}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tenant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : tenant.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {tenant.totalUsers ?? 0}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {tenant.totalProjects ?? 0}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {tenant.totalTasks ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Projects Section */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">All Projects Across Tenants</h2>
          {allProjects.length === 0 ? (
            <p className="text-gray-600">No projects yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((project) => {
                const tenant = tenantMap[project.tenantId];
                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-blue-600">{project.name}</h3>
                      {tenant && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tenant: <span className="font-semibold">{tenant.name}</span> ({tenant.subdomain})
                        </p>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="badge-active text-xs">{project.status}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {project.taskCount || 0} tasks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // TENANT ADMIN DASHBOARD - Stats and project management
  if (user?.role === 'tenant_admin') {
    return (
      <div className="container-main">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.fullName}!</h1>
        <p className="text-gray-600 mb-8">
          Tenant: <span className="font-semibold">{user?.tenant?.name}</span>
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-gray-600 text-sm font-semibold mb-2">Team Members</div>
            <div className="text-4xl font-bold text-blue-600">{stats.totalUsers}</div>
            <p className="text-gray-500 text-xs mt-2">
              Limit: {user?.tenant?.maxUsers || 'N/A'}
            </p>
          </div>

          <div className="card">
            <div className="text-gray-600 text-sm font-semibold mb-2">Active Projects</div>
            <div className="text-4xl font-bold text-green-600">{stats.totalProjects}</div>
            <p className="text-gray-500 text-xs mt-2">
              Limit: {user?.tenant?.maxProjects || 'N/A'}
            </p>
          </div>

          <div className="card">
            <div className="text-gray-600 text-sm font-semibold mb-2">Total Tasks</div>
            <div className="text-4xl font-bold text-purple-600">{stats.totalTasks}</div>
            <p className="text-gray-500 text-xs mt-2">Across all projects</p>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Plan</p>
              <p className="text-lg font-semibold capitalize">
                {user?.tenant?.subscriptionPlan}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <span className={`badge ${
                user?.tenant?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user?.tenant?.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="card text-center p-8 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold mb-2">Manage Projects</h3>
            <p className="text-gray-600">Create and manage projects for your team</p>
          </button>

          <button
            onClick={() => navigate('/users')}
            className="card text-center p-8 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-xl font-bold mb-2">Manage Team</h3>
            <p className="text-gray-600">Add users, set roles, and manage permissions</p>
          </button>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <p className="text-gray-600">No projects yet. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{project.name}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                      {project.taskCount || 0} tasks
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // REGULAR USER DASHBOARD - Quick actions and assigned tasks
  return (
    <div className="container-main">
      <h1 className="text-4xl font-bold mb-2">Welcome, {user?.fullName}!</h1>
      <p className="text-gray-600 mb-8">
        Tenant: <span className="font-semibold">{user?.tenant?.name}</span>
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="text-gray-600 text-sm font-semibold mb-2">My Tasks</div>
          <div className="text-4xl font-bold text-blue-600">{myTasks.length}</div>
          <p className="text-gray-500 text-xs mt-2">Pending completion</p>
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm font-semibold mb-2">Available Projects</div>
          <div className="text-4xl font-bold text-green-600">{recentProjects.length}</div>
          <p className="text-gray-500 text-xs mt-2">You can contribute to</p>
        </div>
      </div>

      {/* Quick Actions */}
      <button
        onClick={() => navigate('/projects')}
        className="card text-center p-8 hover:shadow-lg transition cursor-pointer mb-8"
      >
        <div className="text-4xl mb-2">📋</div>
        <h3 className="text-xl font-bold mb-2">View Projects</h3>
        <p className="text-gray-600">See all projects and available tasks</p>
      </button>

      {/* My Assigned Tasks */}
      {myTasks.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">My Assigned Tasks</h2>
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className="card mt-8">
        <h2 className="text-xl font-bold mb-4">Projects</h2>
        {recentProjects.length === 0 ? (
          <p className="text-gray-600">No projects available yet</p>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                    {project.taskCount || 0} tasks
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
