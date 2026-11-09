import { bundleToSingleHtml } from "../node_modules/@hyperframes/core/dist/compiler/index.js";

const projectDir = process.argv[2];

if (!projectDir) {
  console.error("Missing preview project directory");
  process.exit(1);
}

void (async () => {
  const html = await bundleToSingleHtml(projectDir);
  process.stdout.write(html);
})().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
