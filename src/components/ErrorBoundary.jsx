import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por Fallback/Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-module module">
          <div className="error-boundary-content">
            <h2 className="error-title">Algo salió mal</h2>
            <p className="error-description">
              Se ha producido un error inesperado en la aplicación. Por favor, 
              intenta recargar la página.
            </p>
            <button 
              className="error-action-btn"
              onClick={() => window.location.reload()}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
