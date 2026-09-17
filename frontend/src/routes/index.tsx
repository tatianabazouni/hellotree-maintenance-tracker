import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceTracker } from "@/features/maintenance/maintenance-tracker";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maintenance Requests | Hellotree" },
      {
        name: "description",
        content: "Submit and manage Hellotree website and app requests.",
      },
      { property: "og:title", content: "Maintenance Requests | Hellotree" },
      {
        property: "og:description",
        content: "Submit and manage Hellotree website and app requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MaintenanceTracker />;
}
