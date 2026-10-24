import { afterEach } from "node:test";

// PGlite allocates WASM memory outside the ordinary JS heap. Collect completed
// fixtures between tests when Windows has little available commit memory.
afterEach(() => {
  if (typeof global.gc === "function") global.gc();
});
