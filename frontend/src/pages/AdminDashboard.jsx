import { useState, useEffect } from 'react';
import apiClient from '../api/axios.js';
import PageHeader from '../components/PageHeader.jsx';
import FormField from '../components/FormField.jsx';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [name, setName] = useState('');
  // student written: adding a state to stop multiple clicks
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // student written: make button unclickable when it starts
    try {
      await apiClient.post('/users', { email, role, name });
      setEmail('');
      setName('');
      setRole('teacher');
      fetchUsers();
    } catch (error) {
      alert("Failed to add user: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false); // student written: make button clickable again when done
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiClient.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert("Failed to delete user");
      }
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="Manage users and roles"
      />

      <div className="admin-dashboard-layout">
        <div className="card admin-section-card">
        <h3>Add New User</h3>
        <form onSubmit={handleAddUser} className="form-grid admin-form-container">
          <FormField
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="User Name"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="User Email"
          />
          <div className="form-field">
            <label>Role</label>
            <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="counsellor">Counsellor</option>
            </select>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn--primary admin-form-btn" disabled={isSubmitting}>
              {isSubmitting ? "Adding User..." : "Add User"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Current Users</h3>
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="admin-table-row">
                    <td>{user.name || '-'}</td>
                    <td>{user.email}</td>
                    <td className="admin-table-role">{user.role}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn--danger btn--small admin-delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="admin-empty-cell">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
