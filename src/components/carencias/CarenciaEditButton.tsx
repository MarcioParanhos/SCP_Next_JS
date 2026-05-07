"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default function CarenciaEditButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("open-carencia-edit"));
    setTimeout(() => {
      const el = document.getElementById("edit-form");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <Button variant="default" size="icon" aria-label="Editar" onClick={handleClick}>
      <Pencil className="w-4 h-4" />
    </Button>
  );
}
