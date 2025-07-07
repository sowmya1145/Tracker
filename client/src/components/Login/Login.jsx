import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import bgImage from '../Image/login.png';

function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const checkPasswordCriteria = (password) => ({
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^\w\s]/.test(password),
    minLength: password.length >= 8,
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    hasLower: false, hasUpper: false, hasNumber: false, hasSpecial: false, minLength: false
  });

  const toggleMode = () => setIsSignup(!isSignup);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (isSignup && name === 'password') {
      setPasswordCriteria(checkPasswordCriteria(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup) {
      if (form.password !== form.confirm) {
        return alert('Passwords do not match.');
      }

      const { hasLower, hasUpper, hasNumber, hasSpecial, minLength } = passwordCriteria;
      if (!(hasLower && hasUpper && hasNumber && hasSpecial && minLength)) {
        return alert('Please meet all password requirements before signing up.');
      }

      try {
        await axios.post('http://localhost:5000/api/auth/register', {
          username: form.username,
          password: form.password,
        });
        alert('User registered successfully! Please log in.');
        setIsSignup(false);
      } catch (error) {
        alert(error.response?.data?.error || 'Registration failed.');
      }
    } else {
      try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          username: form.username,
          password: form.password,
        });

        alert(res.data.message);
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      } catch (error) {
        alert(error.response?.data?.error || 'Login failed.');
      }
    }
  };

  return (
    <div className='login-container'>
      <div className='login-auth-container'>
        <div className='login-left-panel' style={{ backgroundImage: `url(${bgImage})` }} />
        <div className='login-right-panel'>
          <h2>{isSignup ? 'REGISTER' : 'LOGIN'}</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              className="login-input"
              type='text'
              name='username'
              placeholder='Username'
              value={form.username}
              onChange={handleChange}
              required
            />

            <input
              className="login-input"
              type={showPass ? 'text' : 'password'}
              name='password'
              placeholder='Password'
              value={form.password}
              onChange={handleChange}
              onFocus={() => setShowChecklist(true)}
              required
            />

            {isSignup &&
              showChecklist &&
              !(
                passwordCriteria.hasLower &&
                passwordCriteria.hasUpper &&
                passwordCriteria.hasNumber &&
                passwordCriteria.hasSpecial &&
                passwordCriteria.minLength
              ) && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0', fontSize: '0.85rem' }}>
                  <li style={{ color: passwordCriteria.hasLower ? 'green' : 'red' }}>✅ 1 lowercase letter</li>
                  <li style={{ color: passwordCriteria.hasUpper ? 'green' : 'red' }}>✅ 1 uppercase letter</li>
                  <li style={{ color: passwordCriteria.hasNumber ? 'green' : 'red' }}>✅ 1 number</li>
                  <li style={{ color: passwordCriteria.hasSpecial ? 'green' : 'red' }}>✅ 1 special character</li>
                  <li style={{ color: passwordCriteria.minLength ? 'green' : 'red' }}>✅ 8+ characters</li>
                </ul>
              )}

            {isSignup && (
              <input
                className="login-input"
                type={showPass ? 'text' : 'password'}
                name='confirm'
                placeholder='Confirm Password'
                value={form.confirm}
                onChange={handleChange}
                required
              />
            )}

            <div className="login-checkbox-row">
              <input
                type='checkbox'
                id='showPassword'
                onChange={() => setShowPass(!showPass)}
              />
              <label htmlFor='showPassword' className="login-checkbox-label">Show Password</label>
            </div>

            <button type='submit' className="login-button">{isSignup ? 'SIGNUP' : 'SIGNIN'}</button>
          </form>

          <div className='login-toggle-text'>
            {isSignup ? (
              <>
                Already have an account? <span onClick={toggleMode}>Sign in here</span>
              </>
            ) : (
              <>
                Don't have an account? <span onClick={toggleMode}>Sign up here</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
