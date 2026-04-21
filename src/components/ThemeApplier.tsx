"use client";

import { useEffect } from "react";

interface ThemeApplierProps {
  accent: string;
  projectColumns: number;
}

export default function ThemeApplier({ accent, projectColumns }: ThemeApplierProps) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", accent);
    document.documentElement.setAttribute("data-columns", String(projectColumns));
  }, [accent, projectColumns]);

  return null;
}
