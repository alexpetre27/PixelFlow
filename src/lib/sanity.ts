import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: "zcrc78yf",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});
export async function getProjects() {
  return await client.fetch(`
    *[_type == "project"] | order(_createdAt desc) {
      title,
      slug,
      category,
      description,
      "image": image.asset->url,
      link,
      github,
      tags
    }
  `);
}
