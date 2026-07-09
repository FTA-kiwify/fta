import type { FastifyInstance } from "fastify";

export async function portalRoutes(app: FastifyInstance) {
  app.get("/portal", async (_request, reply) => {
    return reply.send("OK");
  });
}