const DEFAULT_SISTEMA = {
  nombre_institucion: "Gobierno Autónomo Municipal",
  nombre_sistema: "Sistema de Registro de Equipos de Computación",
  responsable: "",
  cargo_responsable: "Jefe de Sistemas TI",
  direccion: "",
  telefono_inst: "",
  logo_texto: "GAM",
  logo_data: "",
};

export function getSistemaConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("gam_sistema_config") || "{}");
    return { ...DEFAULT_SISTEMA, ...saved };
  } catch {
    return DEFAULT_SISTEMA;
  }
}

export function addSistemaLogo(doc, sistema, x, y, size = 16) {
  if (!sistema.logo_data) return;
  try {
    doc.addImage(sistema.logo_data, "PNG", x, y, size, size);
  } catch {
    // El PDF conserva el encabezado textual si el formato no es compatible.
  }
}
