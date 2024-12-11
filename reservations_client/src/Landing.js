// src/Landing.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import Login from './Login';
import CreateUser from './CreateUser';
//import Item from './Item';

function Foo() {
  return <h1>Hello, App is Rendering!</h1>;
}

function Landing() {
  return (
    <Router>
      <div>
        <Routes>
	  <Route path="/" element={<Login />} />
	  <Route path="/create-user" element={<CreateUser />} />
          <Route path="/App" element={<App />} />
        </Routes>
      </div>
    </Router>
  );
}

export default Landing;

