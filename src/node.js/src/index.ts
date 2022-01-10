import readline from "readline";
import { Web3Storage, File } from "web3.storage";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query = ""): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  let token = process.env.TOKEN;

  if (!token) {
    token = await question("Token: ");
  }

  if (!token) {
    return console.error(
      "A token is needed. You can create one on https://web3.storage",
    );
  }

  const storage = new Web3Storage({ token });

  let files: File[] = [];

  const fileCount = parseInt(await question("How many files: "));

  for (let i = 1; i <= fileCount; i++) {
    const name = await question(`${i}. File Name: `);
    const content = await question(`${i}. File Content: `);
    const mimetype = await question(`${i}. MIME Type (eg. text/plain): `);

    files.push(new File([content], name, { type: mimetype }));
  }

  console.log(`Uploading ${files.length} files`);

  const cid = await storage.put(files);

  console.log(`Content added with CID: ${cid}`);

  console.log(`Link: https://cloudflare-ipfs.com/ipfs/${cid}`);

  process.exit(0);
}

main();
