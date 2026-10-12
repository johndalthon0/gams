import { useEffect, useRef, useState } from "react";

// Decide si una tabla entra completa en su contenedor o si hay que
// encajonarla en tarjetas -- no por un ancho de pantalla adivinado, sino
// midiendo de verdad si el contenido se desborda.
//
// Truco: cuando está en modo tarjeta, las filas pasan a display:block y
// la tabla deja de tener un ancho "natural" que medir (scrollWidth queda
// igual al contenedor). Por eso se guarda el último ancho natural medido
// mientras estaba en modo tabla, y esa referencia es la que se compara
// para decidir si ya volvió a entrar.
export function useTableFit() {
  const wrapRef = useRef(null);
  const naturalWidthRef = useRef(0);
  const [forzarTarjeta, setForzarTarjeta] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const medir = () => {
      const tabla = wrap.querySelector("table");
      if (!tabla) return;
      const disponible = wrap.clientWidth;

      if (!wrap.classList.contains("rtable-tarjeta")) {
        // En modo tabla: el ancho natural real es medible ahora mismo.
        naturalWidthRef.current = tabla.scrollWidth;
      }

      const necesario = naturalWidthRef.current || tabla.scrollWidth;
      setForzarTarjeta(necesario > disponible + 1);
    };

    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(wrap);

    const mo = new MutationObserver(medir);
    mo.observe(wrap, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return { wrapRef, forzarTarjeta };
}
