import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSubdomain: '',
    isSuperAdmin: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.isSuperAdmin && !formData.tenantSubdomain.trim()) {
      newErrors.tenantSubdomain = 'Tenant subdomain is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const tenantSub = formData.isSuperAdmin ? '' : formData.tenantSubdomain;
      await login(formData.email, formData.password, tenantSub);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          SaaS Platform
        </h1>
        <p className="text-center text-gray-600 mb-8">Login to your account</p>

        {authError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Tenant Subdomain
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="tenantSubdomain"
                value={formData.tenantSubdomain}
                onChange={handleChange}
                placeholder="yourcompany"
                className="input-field flex-1"
                disabled={formData.isSuperAdmin}
              />
              <span className="text-gray-600 whitespace-nowrap text-sm">
                .saasplatform.com
              </span>
            </div>
            {errors.tenantSubdomain && (
              <p className="text-error mt-1">{errors.tenantSubdomain}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isSuperAdmin"
              type="checkbox"
              name="isSuperAdmin"
              checked={formData.isSuperAdmin}
              onChange={handleChange}
            />
            <label htmlFor="isSuperAdmin" className="text-gray-700">
              Log in as Super Admin (no tenant)
            </label>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="input-field"
            />
            {errors.email && (
              <p className="text-error mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
            />
            {errors.password && (
              <p className="text-error mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-semibold py-3 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Register here
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-2 font-semibold">Demo Credentials:</p>
          <p className="text-xs text-gray-600 mb-1">
            <strong>Tenant:</strong> demo
          </p>
          <p className="text-xs text-gray-600 mb-1">
            <strong>Email:</strong> admin@demo.com
          </p>
          <p className="text-xs text-gray-600">
            <strong>Password:</strong> Demo@123
          </p>
        </div>
      </div>
    </div>
  );
}
