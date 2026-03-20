export type MenuOption = {
  id: string;
  label: string;
};

export const menuOptions: MenuOption[] = [
  { id: "free_chat", label: "Free Chat" },
  { id: "micro_drills", label: "Micro-Drills" },
  { id: "tone_practice", label: "Tone Practice" },
  { id: "preferences", label: "Preferences" },
  { id: "pause", label: "Pause/Resume" },
  { id: "support", label: "Support / Report Bug" },
  { id: "delete", label: "Delete Account" }
];
