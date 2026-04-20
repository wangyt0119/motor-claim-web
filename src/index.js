import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import AdminStandaloneApp from './apps/AdminStandaloneApp';
import CustomerStandaloneApp from './apps/CustomerStandaloneApp';
import OfficerStandaloneApp from './apps/OfficerStandaloneApp';
import PanelWorkshopStandaloneApp from './apps/PanelWorkshopStandaloneApp';
import reportWebVitals from './reportWebVitals';

const targetApp = process.env.REACT_APP_TARGET_APP || 'main';
const appMap = {
  main: App,
  customer: CustomerStandaloneApp,
  admin: AdminStandaloneApp,
  officer: OfficerStandaloneApp,
  'panel-workshop': PanelWorkshopStandaloneApp,
};
const RootApp = appMap[targetApp] || App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();




