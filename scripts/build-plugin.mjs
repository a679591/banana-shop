// Builds the sandboxed catalog-manager plugin and makes sure the site can find it.
// Runs automatically before `astro build` (see package.json "build").
import { execSync } from "node:child_process";
import { cpSync, existsSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = resolve(root, "catalog-manager");
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit", shell: true });

console.log("Building catalog-manager plugin…");
if (!existsSync(resolve(pluginDir, "node_modules"))) run("npm ci --no-audit --no-fund", pluginDir);
run("npm run build", pluginDir);

if (!existsSync(resolve(pluginDir, "dist", "plugin.mjs"))) {
	console.error("catalog-manager build did not produce dist/plugin.mjs");
	process.exit(1);
}

// pnpm may install the plugin as a copy instead of a link; refresh that copy's dist folder.
const installed = resolve(root, "node_modules", "catalog-manager");
if (existsSync(installed) && realpathSync(installed) !== realpathSync(pluginDir)) {
	cpSync(resolve(pluginDir, "dist"), resolve(realpathSync(installed), "dist"), { recursive: true });
	console.log("Copied plugin build into node_modules/catalog-manager");
}
