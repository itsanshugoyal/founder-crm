import { createApplication, type Environment } from "./server/app";
export default {
  async fetch(request: Request, env: Environment) {
    const { app } = await createApplication({ env, mode: "production" });
    return app.fetch(request);
  },
};
