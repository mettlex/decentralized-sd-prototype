import readline from "readline";
import { Web3Storage, File } from "web3.storage";
import {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  naclBoxPairFromSecret,
  naclEncrypt,
  secp256k1Sign,
  secp256k1Verify,
  secp256k1PairFromSeed,
  blake2AsU8a,
  base64Encode,
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

  const { publicKey, secretKey } = await generateKeyPair();

  if (!secretKey) {
    return;
  }

  let files: File[] = [];
  let nonces = [];
  let signatures = [];

  const fileCount = parseInt(await question("How many files: "));

  for (let i = 1; i <= fileCount; i++) {
    const name = await question(`${i}. File Name: `);

    const { encrypted, nonce } = naclEncrypt(
      stringToU8a(await question(`${i}. File Content: `)),
      secretKey,
    );

    nonces.push(nonce);

    console.log(`${i}. Nonce: ${u8aToHex(nonce)}`);

    const { publicKey: pbk, secretKey: sck } = secp256k1PairFromSeed(
      blake2AsU8a(secretKey, 256),
    );

    const signed = secp256k1Sign(
      encrypted,
      {
        publicKey: pbk,
        secretKey: sck,
      },
      "blake2",
      true,
    );

    signatures.push(signed);

    console.log(i + ". Signature:", u8aToHex(signed));

    const verified = secp256k1Verify(encrypted, signed, pbk, "blake2", true);

    console.log(i + ". Verified:", verified);

    if (!verified) {
      return;
    }

    const content = base64Encode(encrypted);

    files.push(new File([content], name, { type: "text/plain" }));
  }

  const metadata = JSON.stringify({
    version: "1.0",
    nacl_public_key: u8aToHex(publicKey),
    nacl_nonces: nonces.map((n) => u8aToHex(n)),
    signatures: signatures.map((s) => u8aToHex(s)),
    sign_algo: "secp256k1",
    content_encoding: "base64",
    encryption: "xsalsa20-poly1305, tweetnacl.js",
  });

  console.log(`\nMetadata:\n\n${metadata}\n`);

  console.log(`Uploading ${files.length} files...`);

  const cid = await storage.put(files, {
    name: await question("Folder/Directory Name: "),
  });

  console.log(`Content added with CID: ${cid}`);
  console.log(`Link: https://cloudflare-ipfs.com/ipfs/${cid}`);
};

export const generateKeyPair = async (): Promise<{
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}> => {
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
    }

    // Create valid Substrate-compatible seed from mnemonic
    seedAlice = mnemonicToMiniSecret(mnemonicAlice);
  } else {
    seedAlice = new Uint8Array(
      Buffer.from((await question("Type Mnemonic/Password: ")).trim()),
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

  return { publicKey, secretKey };
};

export default upload;
