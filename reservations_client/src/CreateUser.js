// src/CreateUser.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

/*
  const handleCreateUser = () => {
    if (username && email) {
      // Here you could add the user to a backend or database
      console.log('User created:', { username, email });
      localStorage.setItem('username', username);
      navigate('/items');
    } else {
      alert('Please enter both username and email');
    }
  };
*/

  const apiUrl = process.env.REACT_APP_API_URL;
  console.log(apiUrl);

  const handleCreateUser = async () => {
    if (username) {
      try {
        // Make a POST request to the add user route
        const response = await fetch(`${apiUrl}/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        });
  
        if (response.ok) {
          alert('User created successfully! Please log in.');
          navigate('/'); // Navigate back to the Login page
        } else {
            const errorData = await response.json();
            console.log(errorData);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          } 
      } catch (error) {
        console.error('Error creating user:', error);
        alert('An unexpected error occurred. Please try again later.');
      }
    } else {
      alert('Please enter a username');
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: '50px' }}>
      <h2>Create User</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: '20px', padding: '10px', width: '80%' }}
      />
      <br />
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: '20px', padding: '10px', width: '80%' }}
      />
      <br />
      <button onClick={handleCreateUser} style={{ padding: '10px 20px', fontSize: '16px' }}>Create Account</button>
    </div>
  );
};

export default CreateUser;

