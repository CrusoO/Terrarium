import Fastify from "fastify";
import { DEV_USER } from "@terrarium/contracts";

const app = Fastify({ logger: true });

app.get("/health", async () => ({
  ok: true,
  actor: DEV_USER,
}));

const port = Number(process.env.PORT ?? 3001);

await app.listen({ port, host: "0.0.0.0" });
