import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const register = async (e) => {
    e.preventDefault();

    try {

      await axios.post("http://localhost:3000/api/auth/register", {
        ...form,
        rol: "PERSONAL" // fijo
      });

      alert("Usuario registrado");
      navigate("/");

    } catch (error) {
      alert("Error al registrar");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card p-4 col-md-5 mx-auto">
        <h3 className="text-center">Registro Usuario</h3>

        <form onSubmit={register}>

          <input
            className="form-control mb-2"
            placeholder="Nombre"
            name="nombre"
            onChange={handleChange}
          />

          <input
            className="form-control mb-2"
            placeholder="Apellido"
            name="apellido"
            onChange={handleChange}
          />

          <input
            className="form-control mb-2"
            placeholder="Email"
            name="email"
            onChange={handleChange}
          />

          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            name="password"
            onChange={handleChange}
          />

          <input
            className="form-control mb-3"
            placeholder="Telefono"
            name="telefono"
            onChange={handleChange}
          />

          <button className="btn btn-success w-100">
            Registrarme
          </button>

        </form>

        <button
          className="btn btn-link mt-2"
          onClick={() => navigate("/")}
        >
          Ya tengo cuenta
        </button>

      </div>
    </div>
  );
}

export default Register;