import readline from "readline";
import { Web3Storage, File } from "web3.storage";
import {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  naclBoxPairFromSecret,
  naclEncrypt,
} from "@polkadot/util-crypto";
import { stringToU8a, u8aToHex } from "@polkadot/util";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
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

  let seedAlice: Uint8Array;

  if (
    (await question("Auto-generate Mnemonic Password? Y or N: "))
      .toLowerCase()
      .startsWith("y")
  ) {
    // Create mnemonic string for Alice using BIP39
    const mnemonicAlice = mnemonicGenerate(24);

    if (
      (await question("Show mnemonic words? Y or N: "))
        .toLowerCase()
        .startsWith("y")
    ) {
      console.log(`Generated mnemonic: ${mnemonicAlice}`);
    }

    // Validate the mnemic string that was generated
    const isValidMnemonic = mnemonicValidate(mnemonicAlice);

    if (!isValidMnemonic) {
      console.error("Invaild mnemonic");
      return;
    }

    // Create valid Substrate-compatible seed from mnemonic
    seedAlice = mnemonicToMiniSecret(mnemonicAlice);
  } else {
    seedAlice = new Uint8Array(
      Buffer.from(await (await question("Type Mnemonic/Password: ")).trim()),
    );
  }

  // Generate new public/secret keypair for Alice from the supplied seed
  const { publicKey, secretKey } = naclBoxPairFromSecret(seedAlice);

  console.log("Public Key:", u8aToHex(publicKey));

  if (
    (await question("Show Secret Key? Y or N: ")).toLowerCase().startsWith("y")
  ) {
    console.log("Secret Key:", u8aToHex(secretKey));
  }

  let files: File[] = [];

  const fileCount = parseInt(await question("How many files: "));

  for (let i = 1; i <= fileCount; i++) {
    const name = await question(`${i}. File Name: `);

    const content = JSON.stringify(
      naclEncrypt(
        stringToU8a(await question(`${i}. File Content: `)),
        secretKey,
      ),
    );

    files.push(new File([content], name, { type: "text/plain" }));
  }

  const cid = await storage.put(files, {
    name: await question("Folder/Directory Name: "),
  });

  console.log(`Uploading ${files.length} files`);
  console.log(`Content added with CID: ${cid}`);
  console.log(`Link: https://cloudflare-ipfs.com/ipfs/${cid}`);
};

export default upload;
