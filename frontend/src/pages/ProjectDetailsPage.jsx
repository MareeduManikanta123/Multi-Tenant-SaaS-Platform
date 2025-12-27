import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, taskService, tenantService } from '../services/api';

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    status: 'todo',
  });

  useEffect(() => {
    loadProjectDetails();
    loadTenantUsers();
  }, [projectId, user?.tenantId]);

  const canUpdateTaskStatus = (task) => {
    if (!user) return false;
    if (user.role === 'tenant_admin') return true;
    return task.assignedTo === user.id;
  };

  const canDeleteTask = () => {
    return user?.role === 'tenant_admin';
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      await loadProjectDetails();
    } catch (err) {
      console.error('Error updating task status:', err);
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const loadTenantUsers = async () => {
    try {
      if (user?.tenantId) {
        const res = await tenantService.listUsers(user.tenantId, { limit: 100 });
        setTenantUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load project details via list and find (backend limit is 100 max)
      const projectsRes = await projectService.listProjects({ limit: 100, page: 1 });
      const proj = projectsRes.data.data.find(p => p.id === projectId);
      
      if (!proj) {
        setError('Project not found');
        return;
      }
      
      setProject(proj);

      // Load tasks for this project (allow super admin to view; ignore errors separately)
      try {
        const tasksRes = await taskService.listTasks(projectId, { limit: 50 });
        setTasks(tasksRes.data.data || []);
      } catch (taskErr) {
        console.error('Error loading tasks:', taskErr);
        // Do not block the page; show empty tasks if access denied
        setTasks([]);
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const taskPayload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        ...(formData.assignedTo && { assignedTo: formData.assignedTo }),
        ...(formData.dueDate && { dueDate: formData.dueDate }),
      };

      if (editingTaskId) {
        await taskService.updateTask(editingTaskId, taskPayload);
        // Reload tasks after update
        const tasksRes = await taskService.listTasks(projectId, { limit: 50 });
        setTasks(tasksRes.data.data || []);
      } else {
        const res = await taskService.createTask(projectId, taskPayload);
        // Directly add the new task to state instead of full reload
        if (res.data.data) {
          setTasks([...tasks, res.data.data]);
        }
      }

      resetForm();
    } catch (err) {
      console.error('Error saving task:', err);
      alert(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      // Remove task from state immediately
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleEditTask = (task) => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
    });
    setEditingTaskId(task.id);
    setShowTaskForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      status: 'todo',
    });
    setEditingTaskId(null);
    setShowTaskForm(false);
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const statusMatch = statusFilter === 'all' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  };

  const canModifyProject = user?.role === 'tenant_admin' || user?.role === 'super_admin' || project?.createdBy === user?.id;
  const canCreateTask = true; // All tenant users can create tasks

  if (loading) {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container-main">
        <div className="card">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <button onClick={() => navigate('/projects')} className="btn-primary">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="container-main">
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-4xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>
          <div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              project.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
            {project.tenantName && (
              <p className="text-sm text-gray-500 mt-1">Tenant: {project.tenantName} ({project.tenantSubdomain})</p>
            )}
          </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tasks ({filteredTasks.length})</h2>
        {canCreateTask && (
          <button
            onClick={() => {
              if (showTaskForm && !editingTaskId) {
                resetForm();
              } else {
                setShowTaskForm(!showTaskForm);
              }
            }}
            className="btn-primary"
          >
            {showTaskForm && !editingTaskId ? 'Cancel' : '+ Add Task'}
          </button>
        )}
      </div>

      {showTaskForm && canCreateTask && (
        <form onSubmit={handleCreateOrUpdateTask} className="card mb-8">
          <h3 className="text-xl font-bold mb-4">
            {editingTaskId ? 'Edit Task' : 'Create New Task'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Task title"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Task description"
                className="input-field"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Unassigned</option>
                  {tenantUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingTaskId ? 'Update Task' : 'Create Task'}
              </button>
              {editingTaskId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm text-gray-700 font-semibold mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 font-semibold mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No tasks yet</p>
          {canCreateTask && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-primary"
            >
              Create Your First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                </div>
                {(canModifyProject || user?.role === 'tenant_admin') && (
                  <div className="flex gap-2 ml-4">
                    {canModifyProject && (
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteTask() && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    disabled={!canUpdateTaskStatus(task)}
                    className={`ml-1 px-2 py-1 border border-gray-300 rounded text-sm ${!canUpdateTaskStatus(task) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.assignedTo && (
                  <div className="text-gray-600">
                    <span>Assigned to: </span>
                    <span className="font-semibold">
                      {tenantUsers.find(u => u.id === task.assignedTo)?.fullName || 'Unknown'}
                    </span>
                  </div>
                )}

                {task.dueDate && (
                  <div className="text-gray-600">
                    <span>Due: </span>
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
