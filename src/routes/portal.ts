console.log(">>> portal.ts carregado");
import type { FastifyInstance } from "fastify";

import { portalLayout } from "../portal/layout";
import { sidebar } from "../portal/components/sidebar";
import { topbar } from "../portal/components/topbar";

export async function portalRoutes(app: FastifyInstance) {
  console.log(">>> Registrando portalRoutes");

  app.get("/portal", async (_request, reply) => {
    const body = `
      <div class="card">

        <h1>Bem-vinda, Larissa 👋</h1>

        <p>
          O Portal Gerencial está em construção.
          Em breve você poderá acompanhar colaboradores,
          projetos, indicadores e rotinas em um único lugar.
        </p>

      </div>
    `;

    return reply.type("text/html").send(
      portalLayout({
        title: "FTA Manager Portal",
        sidebar: sidebar(),
        topbar: topbar("Dashboard"),
        body,
      })
    );
  });
}