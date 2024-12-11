// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = React.useState('');
  const navigate = useNavigate();

/*
  const handleLogin = () => {
    if (username) {
      localStorage.setItem('username', username);
      navigate('/App');
    } else {
      alert('Please enter a username');
    }
  };
*/

  const apiUrl = process.env.REACT_APP_API_URL;
  console.log(apiUrl);

  const handleLogin = async () => {
    if (username) {
      try {
        const response = await fetch(`${apiUrl}/user/exists/${username}`);
        if (response.ok) {
          const exists = await response.json();
          if (exists === "true") {
          //  localStorage.setItem('username', username);
            navigate('/App', { state: { username } });
          } else {
            alert('Username does not exist. Please create an account.');
          }
        } else {
          alert('Error checking username. Please try again later.');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        alert('An unexpected error occurred. Please try again later.');
      }
    } else {
      alert('Please enter a username');
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: '50px' }}>
      <h1 style={{ color: 'teal', fontSize: '40px' }}>Reservation Tracker 😋</h1>
      <h2>Please Login</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          marginBottom: '20px',
          padding: '10px',
          width: '300px', // Adjusted width to make it smaller
          maxWidth: '80%', // Make it responsive by setting a max-width
        }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>Login</button>
      <p style={{ marginTop: '20px' }}>
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/create-user')}
          style={{ textDecoration: 'underline', color: 'blue', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Create User
        </button>
      </p>
    </div>
  );
};

export default Login;

