export default {
  name: "project",
  title: "Proiecte",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Titlu Proiect",
      type: "string",
    },
    {
      name: "category",
      title: "Categorie",
      type: "string",
    },
    {
      name: "description",
      title: "Descriere",
      type: "text",
    },
    {
      name: "image",
      title: "Imagine Principală",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "link",
      title: "Link Proiect",
      type: "url",
    },
    {
      name: "tags",
      title: "Tehnologii",
      type: "array",
      of: [{ type: "string" }],
    },
  ],
};
