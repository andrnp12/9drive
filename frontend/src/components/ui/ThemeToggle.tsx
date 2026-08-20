import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  // Cycle through themes: light -> system -> dark -> light
  const cycleTheme = () => {
    if (theme === "light") setTheme("system");
    else if (theme === "system") setTheme("dark");
    else setTheme("light");
  };

  // Get icon and label based on current theme
  const getIconAndLabel = () => {
    switch (theme) {
      case "light":
        return {
          icon: <Sun className="h-5 w-5" />,
          label: "Light mode",
          title: "Light",
        };
      case "system":
        return {
          icon: <Monitor className="h-5 w-5" />,
          label: "System preference",
          title: "System",
        };
      case "dark":
        return {
          icon: <Moon className="h-5 w-5" />,
          label: "Dark mode",
          title: "Dark",
        };
    }
  };

  const { icon, label, title } = getIconAndLabel();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={label}
      title={title}
      className={cn(
        "focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 transition-colors duration-200",
        className,
      )}
    >
      {icon}
    </Button>
  );
}
