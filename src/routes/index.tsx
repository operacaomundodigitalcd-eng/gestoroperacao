import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Ritmo · Gestão de Indicadores e Performance" },
      {
        name: "description",
        content:
          "Plataforma de gestão de indicadores, metas e performance de equipes com dashboards executivos, planos de ação e apresentações gerenciais.",
      },
      { property: "og:title", content: "Ritmo · Gestão de Indicadores e Performance" },
      {
        property: "og:description",
        content: "Acompanhe indicadores, metas e resultados das equipes em um painel executivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
