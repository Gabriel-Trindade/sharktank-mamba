import { Moon, Sun } from "lucide-react";
import { Button } from "./Button";

type ThemeToggleProps = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => (
  <Button
    aria-label="Alternar tema"
    title="Alternar tema"
    variant="ghost"
    icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    onClick={onToggle}
  >
    {theme === "dark" ? "Tema claro" : "Tema escuro"}
  </Button>
);
