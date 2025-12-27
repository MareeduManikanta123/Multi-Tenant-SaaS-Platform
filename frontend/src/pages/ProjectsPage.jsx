import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [page, setPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState(null);
  const { user } = useAuth();
  const canManageProjects = user?.role === 'tenant_admin';

  useEffect(() => {
    loadProjects();
  }, [page]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await projectService.listProjects({ page, limit: 10 });
      setProjects(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      await projectService.createProject(formData);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setSuccessMessage('Project created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setPage(1);
      loadProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      alert(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will be deleted.')) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      loadProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Projects</h1>
        {canManageProjects && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {showCreateForm && canManageProjects && (
        <form onSubmit={handleCreateProject} className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Project name"
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
                placeholder="Project description"
                className="input-field"
                rows="3"
              />
            </div>
            <button type="submit" className="btn-primary">
              Create Project
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No projects yet</p>
          {canManageProjects && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition">
              <div className="mb-4">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-xl font-bold text-blue-600 hover:underline"
                >
                  {project.name}
                </Link>
              </div>

              {project.description && (
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
              )}

              <div className="flex justify-between items-center mb-4">
                <span className="badge-active">{project.status}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {project.taskCount} tasks
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/projects/${project.id}`}
                  className="flex-1 btn-secondary text-center text-sm"
                >
                  View
                </Link>
                {canManageProjects && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn-danger text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
