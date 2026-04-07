"use client";

// Usa o Toaster oficial da lib `sonner`, que é compatível com as chamadas
// `toast.success(...)` / `toast.error(...)` feitas em todos os componentes.
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

const Toaster = (props: React.ComponentProps<typeof SonnerToaster>) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as React.ComponentProps<typeof SonnerToaster>["theme"]}
      position="top-right"
      richColors
      closeButton
      {...props}
    />
  );
};

export { Toaster };
