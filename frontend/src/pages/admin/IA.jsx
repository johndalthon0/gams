import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";

function IA() {

  const [data, setData] = useState([]);

  useEffect(() => {
    getPredicciones();
  }, []);

  const getPredicciones = async () => {
    const res = await api.get("/ia");
    setData(res.data);
  };

  return (
    <AdminLayout>

      <h3>Predicciones IA</h3>

      <table className="table mt-3">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Probabilidad</th>
            <th>Fecha recomendada</th>
          </tr>
        </thead>

        <tbody>
          {data.map(p => (
            <tr key={p.id}>
              <td>{p.equipo}</td>
              <td>{p.probabilidad_falla}%</td>
              <td>{p.fecha_recomendada}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </AdminLayout>
  );
}

export default IA;