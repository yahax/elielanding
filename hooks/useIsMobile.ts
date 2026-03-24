"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = `(max-width: ${breakpoint - 1}px)`;
    const media = window.matchMedia(query);

    const update = () => {
      setIsMobile(media.matches);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
