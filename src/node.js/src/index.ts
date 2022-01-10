import upload from "./upload-polkadot";

async function main() {
  await upload();

  process.exit(0);
}

main();
