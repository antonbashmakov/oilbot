import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const FUNCTIONS_DIR = path.resolve(__dirname, "../..");

const read = (file: string): Record<string, string> => {
  const full = path.join(FUNCTIONS_DIR, file);
  return fs.existsSync(full) ? dotenv.parse(fs.readFileSync(full)) : {};
};

/**
 * The variables the functions emulator of project test-project loads (.env, .env.test-project,
 * .env.local; later files win), so tests sign tokens with the same secrets even when a developer
 * keeps a real bot token in .env.local.
 */
export const emulatorEnv: Record<string, string> = {
  ...read(".env"),
  ...read(".env.test-project"),
  ...read(".env.local"),
};
