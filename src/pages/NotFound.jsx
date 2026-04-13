import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="not-found-module module">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Página Inexistente</h2>
        <p className="error-description">
          La ruta a la que intentas acceder no existe o ha sido movida.
          Comprueba que la dirección URL sea la correcta.
        </p>
        <Link to="/" className="error-action-btn">
          Volver a la Portada
        </Link>
      </div>
    </div>
  );
}
