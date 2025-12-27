import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tenantService, userService } from '../services/api';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentUser?.tenantId) {
        const res = await tenantService.listUsers(currentUser.tenantId, {
          page: 1,
          limit: 50,
        });
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.fullName) {
      alert('Email and Full Name are required');
      return;
    }

    if (!editingUserId && !formData.password) {
      alert('Password is required for new users');
      return;
    }

    try {
      if (editingUserId) {
        // Update user
        const updatePayload = {
          fullName: formData.fullName,
          role: formData.role,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await userService.updateUser(editingUserId, updatePayload);
      } else {
        // Add new user
        await tenantService.addUser(currentUser?.tenantId, {
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          role: formData.role,
        });
      }
      resetForm();
      loadUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? Their assigned tasks will become unassigned.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setFormData({
      email: user.email,
      fullName: user.fullName,
      password: '',
      role: user.role,
    });
    setEditingUserId(user.id);
    setShowAddForm(true);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await userService.updateUser(userId, { isActive: !currentStatus });
      loadUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      password: '',
      role: 'user',
    });
    setEditingUserId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="container-main">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Only tenant admin and super admin can add/manage users
  const canManageUsers = currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin';

  return (
    <div className="container-main">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Team Members</h1>
        {canManageUsers && (
          <button
            onClick={() => {
              if (showAddForm && !editingUserId) {
                resetForm();
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
            className="btn-primary"
          >
            {showAddForm && !editingUserId ? 'Cancel' : '+ Add User'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showAddForm && canManageUsers && (
        <form onSubmit={handleAddOrUpdateUser} className="card mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingUserId ? 'Edit User' : 'Add New User'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@company.com"
                  className="input-field"
                  disabled={editingUserId ? true : false}
                />
                {editingUserId && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Password {editingUserId ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="user">User</option>
                  <option value="tenant_admin">Tenant Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingUserId ? 'Update User' : 'Add User'}
              </button>
              {editingUserId && (
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

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No users in this team yet</p>
          {canManageUsers && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First User
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
                {canManageUsers && (
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">{u.fullName}</td>
                  <td className="py-3 px-4 text-gray-700">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {u.role === 'tenant_admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.isActive ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                        Inactive
                      </span>
                    )}
                  </td>
                  {canManageUsers && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleEditUser(u)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                              className="text-orange-600 hover:underline text-sm"
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {u.id === currentUser?.id && (
                          <span className="text-gray-500 text-sm italic">You (Current)</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
