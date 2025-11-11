import React from 'react';
import { createRoot } from 'react-dom/client'; // Ya da eski React.dom.render
import App from './App';
// CSS dosyasını import etmeyi unutmayın!

import './css/AccountingPage.css';
import './css/AddProduct.css'; 
import './css/AuthScreen.css';
import './css/CategoryManager.css'; 
import './css/Dashboard.css';
import './css/ExpenseManager.css'; 
import './css/LoadingScreen.css';
import './css/Modal.css';
import './css/Navbar.css';
import './css/ProductList.css';
import './css/Sales.css'; 
import './css/Toast.css'; 











const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);