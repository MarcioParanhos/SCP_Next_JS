"use client";

import { useThemeConfig } from "./layout/active-theme";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_THEMES = [
  {
    name: "Padrão",
    value: "default",
  },
  {
    name: "Azul",
    value: "blue",
  },
  {
    name: "Verde",
    value: "green",
  },
  {
    name: "Vermelho",
    value: "red",
  },
  {
    name: "Amarelo",
    value: "amber",
  },
];

const SCALED_THEMES = [
  {
    name: "Padrão",
    value: "default-scaled",
  },
  {
    name: "Azul",
    value: "blue-scaled",
  },
  {
    name: "Verde",
    value: "green-scaled",
  },
  {
    name: "Vermelho",
    value: "red-scaled",
  },
  {
    name: "Amarelo",
    value: "amber-scaled",
  },
  {
    name: "Mono",
    value: "mono-scaled",
  },
];

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="justify-start *:data-[slot=select-value]:w-16"
        >
          <span className="text-muted-foreground hidden sm:block">
            Selecione o Tema:
          </span>
          <span className="text-muted-foreground block sm:hidden">Theme</span>
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>Padrão</SelectLabel>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Escalados</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
