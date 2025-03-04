// import React from 'react';
// import ReactDOM from 'react-dom/client';
import { render } from 'preact';
import App from './App.tsx';
import './style.css';

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );

render(<App />, document.getElementById('root')!);
