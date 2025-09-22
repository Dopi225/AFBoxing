import React from 'react';

const TestApp = () => {
  console.log('TestApp is rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#e60000' }}>🧪 Test AF Boxing Club</h1>
      <p>Si vous voyez cette page, React fonctionne correctement.</p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ Composants de base fonctionnels</h2>
        <ul>
          <li>React - OK</li>
          <li>JSX - OK</li>
          <li>CSS inline - OK</li>
        </ul>
      </div>
    </div>
  );
};

export default TestApp;
