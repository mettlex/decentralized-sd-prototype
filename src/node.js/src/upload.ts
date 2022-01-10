import readline from "readline";
import { Web3Storage, File } from "web3.storage";

const crypto: Crypto = require("crypto").webcrypto;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query = ""): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

export const upload = async () => {
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

  const digest = await crypto.subtle.digest(
    {
      name: "SHA-512",
    },
    Buffer.from(await question("Password: ")),
  );

  const importedPBKDF2Key = await crypto.subtle.importKey(
    "raw",
    digest,
    {
      name: "PBKDF2",
    },
    false,
    ["deriveKey", "deriveBits"],
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 1000,
      hash: { name: "SHA-512" },
    },
    importedPBKDF2Key,
    {
      name: "AES-CBC",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );

  let files: File[] = [];

  const fileCount = parseInt(await question("How many files: "));

  for (let i = 1; i <= fileCount; i++) {
    const name = await question(`${i}. File Name: `);

    const content = Buffer.from(
      await crypto.subtle.encrypt(
        {
          name: "AES-CBC",
          iv,
        },
        derivedKey,
        Buffer.from(await question(`${i}. File Content: `)),
      ),
    ).toString("hex");

    files.push(new File([content], name, { type: "text/plain" }));
  }

  const cid = await storage.put(files, {
    name: await question("Folder/Directory Name: "),
  });

  console.log(`Uploading ${files.length} files`);
  console.log("Salt:", Buffer.from(salt).toString("hex"));
  console.log("IV:", Buffer.from(iv).toString("hex"));
  console.log(`Content added with CID: ${cid}`);
  console.log(`Link: https://cloudflare-ipfs.com/ipfs/${cid}`);
};

export default upload;
