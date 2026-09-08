import { useEffect, useState } from "react";

// true cuando el ancho de la ventana es <= bp (móvil / ventana angosta).
export function useIsNarrow(bp = 680) {
  const get = () =>
    typeof window !== "undefined" && window.innerWidth <= bp;
  const [narrow, setNarrow] = useState(get);

  useEffect(() => {
    const on = () => setNarrow(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp]);

  return narrow;
}
