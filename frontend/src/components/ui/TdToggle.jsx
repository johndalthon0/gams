// Celda "Ver más / Ver menos" para tablas .rtable: en móvil, cada fila
// arranca mostrando solo las columnas sin className="td-sec"; esta celda
// (con un checkbox oculto, pura CSS vía :has()) revela las demás al tocarla.
// En escritorio no se ve (la tabla se muestra normal, sin encajonar).
export default function TdToggle() {
  return (
    <td className="rtable-toggle-cell" data-label="toggle">
      <label className="rtable-toggle">
        <input type="checkbox" className="rtable-chk" />
        <span className="rtable-toggle-icon">⌄</span>
      </label>
    </td>
  );
}
