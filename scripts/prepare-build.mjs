import { mkdir, access, writeFile } from "node:fs/promises";
await mkdir("src/generated", { recursive: true });
try {
  await access("src/generated/assets.ts");
} catch {
  await writeFile(
    "src/generated/assets.ts",
    "export default {} as Record<string,string>;\n",
  );
}
