import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" role="alert" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Une erreur est survenue</h1>
          <p style={{ marginBottom: '1.5rem', color: '#555', maxWidth: '32rem', marginInline: 'auto' }}>
            Rechargez la page ou revenez plus tard. Si le problème persiste, contactez l’administrateur du site.
          </p>
          <button
            type="button"
            className="modern-card"
            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px' }}
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
