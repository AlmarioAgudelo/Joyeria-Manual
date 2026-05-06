import { NavLink } from 'react-router-dom'

function NavBar() {
  return (
    <nav className="nav-bar">
      <NavLink to="/inventario" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Inventario
      </NavLink>
      <NavLink to="/ventas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Registrar venta
      </NavLink>
      <NavLink to="/historial-ventas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Historial ventas
      </NavLink>
      <NavLink to="/balance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Balance
      </NavLink>
    </nav>
  )
}

export default NavBar
