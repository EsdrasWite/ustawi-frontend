import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
};
