import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => (
  <div className="auth-layout">
    <div className="auth-layout__card">
      <div className="auth-layout__brand">
        <h1>FirstCry Intellitots</h1>
        <p>Lesson Plan Builder</p>
      </div>
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;
