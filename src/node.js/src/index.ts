import upload from "./upload";
import recover from "./recover";
import { question } from "./utils";

async function main() {
  const query = await question("Upload or Recover? Enter U or R: ");

  if (query.toUpperCase()[0] === "U") {
    await upload();
  } else if (query.toUpperCase()[0] === "R") {
    await recover();
  }

  process.exit(0);
}

main();
