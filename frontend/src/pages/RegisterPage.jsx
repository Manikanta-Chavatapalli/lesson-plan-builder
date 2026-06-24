import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import FormField from '../components/FormField.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { getApiError } from '../services/index.js';
import { validateAuthForm } from '../utils/validation.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateAuthForm(form, true);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (error) {
      setApiError(getApiError(error).message);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p className="auth-form__subtitle">Register to manage lesson plans</p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="Jane Teacher"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
          placeholder="teacher@intellitots.com"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
          placeholder="Min. 6 characters"
        />
        <ErrorAlert message={apiError} onDismiss={() => setApiError('')} />
        <button type="submit" className="btn btn--primary btn--full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="auth-form__link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
