import React from 'react';
import { ErrorState } from './PageStates';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <ErrorState
            title="Une erreur est survenue"
            message="Rechargez la page ou revenez plus tard. Si le problème persiste, contactez le club."
            onRetry={() => window.location.reload()}
            retryLabel="Recharger la page"
          />
        </div>
      );
    }
    return this.props.children;
  }
}
