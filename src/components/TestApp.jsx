import React from 'react';

const TestApp = () => {
  console.log('TestApp is rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'var(--surface-base)', 
      minHeight: '100vh',
      fontFamily: 'var(--font-primary)'
    }}>
      <h1 style={{ color: 'var(--primary-red)' }}>🧪 Test AF Boxing Club</h1>
      <p>Si vous voyez cette page, React fonctionne correctement.</p>
      <div style={{ 
        backgroundColor: 'var(--surface-elevated)', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px',
        boxShadow: 'var(--shadow-2)'
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
