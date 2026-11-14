"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isLight, setIsLight] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("ShipLane-theme");
    const light = savedTheme === "light";
    document.documentElement.classList.toggle("light", light);
    setIsLight(light);
  }, []);

  const toggleTheme = () => {
    const nextIsLight = !isLight;
    document.documentElement.classList.toggle("light", nextIsLight);
    window.localStorage.setItem("ShipLane-theme", nextIsLight ? "light" : "dark");
    setIsLight(nextIsLight);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      title={`Switch to ${isLight ? "dark" : "light"} theme`}
      aria-pressed={isLight}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
