import { Navigate, Outlet } from "react-router-dom";

function PrivateRoute({ role }) {

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");

  // Sin sesión → login
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Rol no coincide → redirigir según su rol
  if (user.rol !== role) {
    if (user.rol === "ADMIN")     return <Navigate to="/admin/dashboard"          replace />;
    if (user.rol === "EMPLEADO")  return <Navigate to="/empleado/reparaciones"    replace />;
    if (user.rol === "PERSONAL")  return <Navigate to="/personal/dashboard"       replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;