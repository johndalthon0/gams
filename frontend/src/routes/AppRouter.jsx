import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Auth ──────────────────────────────────────────────────────
import Login    from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// ── Admin ─────────────────────────────────────────────────────
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
import Inventario     from "../pages/admin/Inventario";
import Compras        from "../pages/admin/Compras";

// ── Empleado / Técnico ────────────────────────────────────────
import EmpleadoDashboard from "../pages/empleado/Dashboard";

// ── Personal ──────────────────────────────────────────────────
import PersonalDashboard   from "../pages/personal/Dashboard";
import MiEquipo            from "../pages/personal/MiEquipo";
import MisSolicitudes      from "../pages/personal/MisSolicitudes";
import Solicitar           from "../pages/personal/Solicitar";

import Perfil              from "../pages/personal/perfil";

// ── Guard ─────────────────────────────────────────────────────
import PrivateRoute from "../components/auth/PrivateRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── PÚBLICAS ── */}
        <Route path="/"          element={<Login />} />
        <Route path="/register"  element={<Register />} />

        {/* ═══════════════════════════════════════
            ADMIN
        ═══════════════════════════════════════ */}
        <Route element={<PrivateRoute role="ADMIN" />}>

          {/* Redirect raíz admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Principal */}
          <Route path="/admin/dashboard"     element={<AdminDashboard />} />

          {/* Gestión */}
          <Route path="/admin/usuarios"      element={<Usuarios />} />
          <Route path="/admin/equipos"       element={<Equipos />} />
          <Route path="/admin/empleados"     element={<Empleados />} />
          <Route path="/admin/asignaciones"  element={<Asignaciones />} />
          <Route path="/admin/reparaciones"  element={<Reparaciones />} />
          <Route path="/admin/bajas"         element={<Bajas />} />
          <Route path="/admin/catalogos"     element={<Catalogos />} />
          <Route path="/admin/configuracion" element={<Configuracion />} />

          {/* Inventario */}
          <Route path="/admin/inventario"    element={<Inventario />} />
          <Route path="/admin/compras"       element={<Compras />} />

          {/* IA */}
          <Route path="/admin/ia"            element={<IA />} />

        </Route>

        {/* ═══════════════════════════════════════
            EMPLEADO / TÉCNICO
        ═══════════════════════════════════════ */}
        <Route element={<PrivateRoute role="EMPLEADO" />}>

          <Route path="/empleado" element={<Navigate to="/empleado/dashboard" replace />} />
          <Route path="/empleado/dashboard"    element={<EmpleadoDashboard />} />
          {/* El técnico también accede a reparaciones */}
          <Route path="/admin/reparaciones"    element={<Reparaciones />} />

        </Route>

        {/* ═══════════════════════════════════════
            PERSONAL
        ═══════════════════════════════════════ */}
        <Route element={<PrivateRoute role="PERSONAL" />}>

          <Route path="/personal" element={<Navigate to="/personal/dashboard" replace />} />
          <Route path="/personal/dashboard"      element={<PersonalDashboard />} />
          <Route path="/personal/mi-equipo"      element={<MiEquipo />} />
          <Route path="/personal/mis-solicitudes"element={<MisSolicitudes />} />
          <Route path="/personal/solicitar"      element={<Solicitar />} />
      
          <Route path="/personal/perfil"         element={<Perfil />} />

        </Route>

        {/* ── 404 → Login ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;