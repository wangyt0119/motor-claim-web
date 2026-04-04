import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OfficerApp from './OfficerApp';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OfficerApp />
  </React.StrictMode>
);

reportWebVitals();