import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { WizardScreen } from "@/components/wizard/WizardScreen";

export const Route = createFileRoute("/wizard")({ component: () => <AppShell><WizardScreen /></AppShell> });
