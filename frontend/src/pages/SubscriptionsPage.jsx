import { useEffect, useState } from 'react';
import { tenantService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    subscriptionPlan: '',
    maxUsers: 0,
    maxProjects: 0,
    status: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    // Only super admins can manage subscriptions
    if (user?.role !== 'super_admin') {
      setError('Only Super Admin can manage subscriptions.');
      setLoading(false);
      return;
    }
    loadTenants();
  }, [page, user?.role]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await tenantService.listTenants({ page, limit: 10 });
      setTenants(res.data.data);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error loading tenants:', err);
      setError('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant.id);
    setEditForm({
      subscriptionPlan: tenant.subscriptionPlan,
      maxUsers: tenant.maxUsers,
      maxProjects: tenant.maxProjects,
      status: tenant.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingTenant(null);
    setEditForm({
      subscriptionPlan: '',
      maxUsers: 0,
      maxProjects: 0,
      status: '',
    });
  };

  const handleUpdateSubscription = async (tenantId) => {
    if (!editForm.subscriptionPlan || !editForm.status) {
      alert('Plan and status are required');
      return;
    }
    if (editForm.maxUsers < 1 || editForm.maxProjects < 1) {
      alert('Max users and projects must be positive');
      return;
    }
    try {
      await tenantService.updateTenant(tenantId, editForm);
      setSuccessMessage('Subscription updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingTenant(null);
      loadTenants();
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert(err.response?.data?.message || 'Failed to update subscription');
    }
  };

  const getPlanBadgeColor = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      trial: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-700">Access denied. Only Super Admin can manage subscriptions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Subscription Management</h1>
        <p className="text-gray-600 mt-2">Manage tenant subscriptions and limits</p>
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{tenant.subdomain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="text-xs px-2 py-1 rounded border border-gray-300"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="trial">Trial</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <select
                        value={editForm.subscriptionPlan}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionPlan: e.target.value })}
                        className="text-xs px-2 py-1 rounded border border-gray-300"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${getPlanBadgeColor(tenant.subscriptionPlan)}`}>
                        {tenant.subscriptionPlan}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editForm.maxUsers}
                        onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) })}
                        className="w-16 text-xs px-2 py-1 rounded border border-gray-300"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">{tenant.maxUsers}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTenant === tenant.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editForm.maxProjects}
                        onChange={(e) => setEditForm({ ...editForm, maxProjects: parseInt(e.target.value) })}
                        className="w-16 text-xs px-2 py-1 rounded border border-gray-300"
                      />
                    ) : (
                      <div className="text-sm text-gray-600">{tenant.maxProjects}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingTenant === tenant.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateSubscription(tenant.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(tenant)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
