import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import reportWebVitals from './reportWebVitals';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/theme.css';

// =====================================
// THEME CONTEXT
// =====================================

import {
  ThemeProvider
} from './context/ThemeContext';

// =====================================
// ROOT
// =====================================

const root = ReactDOM.createRoot(
  document.getElementById('root')
);

root.render(

  <React.StrictMode>

    <ThemeProvider>

      <App />

    </ThemeProvider>

  </React.StrictMode>

);

// =====================================
// REPORT
// =====================================

reportWebVitals();