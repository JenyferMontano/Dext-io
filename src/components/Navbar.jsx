import { NavLink, useLocation } from 'react-router-dom';
import { routes } from '../router/routes.js';

function formatMastheadDate() {
  const s = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return s.toLocaleUpperCase('es');
}

export function Navbar() {
  const { pathname } = useLocation();
  const seccionesActive = pathname.startsWith('/c/') || pathname === routes.communities;

  return (
    <header className="nav-masthead">
      <div className="nav-masthead-util">
        <div className="nav-masthead-util-inner">
          <span className="nav-masthead-spacer" aria-hidden />
          <div className="nav-masthead-util-actions">
            <button type="button" className="nav-text-btn">
              Suscribirse
            </button>
            <button type="button" className="nav-text-btn nav-text-btn--emphasis">
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="nav-masthead-brand-row">
        <NavLink to={routes.home} className="nav-brand-blackletter" end>
          Dext.io
        </NavLink>
      </div>

      <p className="nav-dateline">
        UNA PUBLICACIÓN DIGITAL DE COMUNIDADES · EDICIÓN LATINOAMÉRICA · {formatMastheadDate()}
      </p>

      <nav className="nav-sections-bar" aria-label="Navegación principal">
        <div className="nav-sections-inner nav-sections-inner--three">
          <NavLink to={routes.home} className="nav-section-link" end>
            Portada
          </NavLink>
          <NavLink
            to={routes.communities}
            className={({ isActive }) =>
              `nav-section-link${seccionesActive || isActive ? ' is-active' : ''}`
            }
          >
            Secciones
          </NavLink>
          <NavLink to={routes.user('u1')} className="nav-section-link">
            Perfil
          </NavLink>
        </div>
      </nav>

      <nav className="nav-mobile-tabs" aria-label="Navegación principal">
        <NavLink to={routes.home} className={({ isActive }) => `nav-mobile-tab${isActive ? ' is-active' : ''}`} end>
          Portada
        </NavLink>
        <NavLink
          to={routes.communities}
          className={({ isActive }) =>
            `nav-mobile-tab${seccionesActive || isActive ? ' is-active' : ''}`
          }
        >
          Secciones
        </NavLink>
        <NavLink to={routes.user('u1')} className={({ isActive }) => `nav-mobile-tab${isActive ? ' is-active' : ''}`}>
          Perfil
        </NavLink>
      </nav>
    </header>
  );
}
