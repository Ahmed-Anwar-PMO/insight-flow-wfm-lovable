import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Support WFM Planner" },
      { name: "description", content: "Workforce management for global customer support: forecasting, staffing, rosters, rotations, SLA, and backlog recovery." },
      { property: "og:title", content: "Support WFM Planner" },
      { name: "twitter:title", content: "Support WFM Planner" },
      { property: "og:description", content: "Workforce management for global customer support: forecasting, staffing, rosters, rotations, SLA, and backlog recovery." },
      { name: "twitter:description", content: "Workforce management for global customer support: forecasting, staffing, rosters, rotations, SLA, and backlog recovery." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0293dc82-6600-47d3-b0a7-2c803133ecf0/id-preview-5aa96ff0--9efc26d4-b2de-46b0-ab8b-9edd1269fd38.lovable.app-1776457960368.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0293dc82-6600-47d3-b0a7-2c803133ecf0/id-preview-5aa96ff0--9efc26d4-b2de-46b0-ab8b-9edd1269fd38.lovable.app-1776457960368.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
