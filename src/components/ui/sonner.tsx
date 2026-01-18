"use client";

import { useTheme } from "next-themes";
import { Toaster as HotToaster } from "react-hot-toast";

const Toaster = (props: any) => {
  const { theme = "system" } = useTheme();

  return (
    <HotToaster
      position="top-center"
      containerStyle={{
        // keep container neutral; individual toasts styled via toastOptions
      }}
      toastOptions={{
        // default duration for all toasts (milliseconds)
        duration: 8000,
        // default style (uses CSS variables defined in globals.css)
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        },
        success: {
          duration: 5000,
          style: {
            background: "var(--toast-success-bg, #ffffff)",
            color: "var(--toast-success-text, #09122C)",
          },
        },
        error: {
          duration: 8000,
          style: {
            background: "var(--toast-error-bg, #ffffff)",
            color: "var(--toast-error-text, #09122C)",
          },
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
