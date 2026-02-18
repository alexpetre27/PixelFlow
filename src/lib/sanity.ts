import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: "more0rqr",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});
