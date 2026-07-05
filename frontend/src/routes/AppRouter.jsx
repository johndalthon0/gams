import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login    from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// ADMIN
import AdminDashboard from "../pages/admin/Dashboard";
import Usuarios       from "../pages/admin/Usuarios";
import Equipos        from "../pages/admin/Equipos";
import Empleados      from "../pages/admin/Empleados";
import Asignaciones   from "../pages/admin/Asignaciones";
import Reparaciones   from "../pages/admin/Reparaciones";
import Bajas          from "../pages/admin/Bajas";
import Catalogos      from "../pages/admin/Catalogos";
import Configuracion  from "../pages/admin/Configuracion";
import IA             from "../pages/admin/IA";
import Repuestos from "../pages/admin/Repuestos";

// PERSONAL
import PersonalDashboard from "../pages/personal/Dashboard";
import MiEquipo          from "../pages/personal/MiEquipo";
import Solicitar         from "../pages/personal/Solicitar";
import MisSolicitudes    from "../pages/personal/MisSolicitudes";
import Perfil            from "../pages/personal/perfil";

import PrivateRoute from "../components/auth/PrivateRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= ADMIN ================= */}
        <Route element={<PrivateRoute role="ADMIN" />}>
          <Route path="/admin/dashboard"     element={<AdminDashboard />} />
          <Route path="/admin/usuarios"      element={<Usuarios />} />
          <Route path="/admin/equipos"       element={<Equipos />} />
          <Route path="/admin/empleados"     element={<Empleados />} />
          <Route path="/admin/asignaciones"  element={<Asignaciones />} />
          <Route path="/admin/reparaciones"  element={<Reparaciones />} />
          <Route path="/admin/bajas"         element={<Bajas />} />
          <Route path="/admin/catalogos"     element={<Catalogos />} />
          <Route path="/admin/configuracion" element={<Configuracion />} />
          <Route path="/admin/ia"            element={<IA />} />
          <Route path="/admin/repuestos" element={<Repuestos />} />
        </Route>

        {/* ================= EMPLEADO (técnico) ================= */}
        {/* Ruta propia /empleado/reparaciones — mismo componente */}
        <Route element={<PrivateRoute role="EMPLEADO" />}>
          <Route path="/empleado/reparaciones" element={<Reparaciones />} />
        </Route>

        {/* ================= PERSONAL ================= */}
        <Route element={<PrivateRoute role="PERSONAL" />}>
          <Route path="/personal/dashboard"      element={<PersonalDashboard />} />
          <Route path="/personal/miequipo"       element={<MiEquipo />} />
          <Route path="/personal/solicitar"      element={<Solicitar />} />
          <Route path="/personal/missolicitudes" element={<MisSolicitudes />} />
          <Route path="/personal/perfil"         element={<Perfil />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;