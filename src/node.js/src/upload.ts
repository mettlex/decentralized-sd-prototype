import { Web3Storage, File } from "web3.storage";
import {
  naclEncrypt,
  secp256k1Sign,
  secp256k1Verify,
  secp256k1PairFromSeed,
  blake2AsU8a,
  base64Encode,
} from "@polkadot/util-crypto";
import { hexToU8a, stringToU8a, u8aToHex } from "@polkadot/util";

import { question } from "./utils";
import { generateKeyPair } from "./crypt";
import sss from "../../sss-wasm/lib";

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

  const { publicKey, secretKey, seed } = await generateKeyPair();

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

  console.log("=== Shamir's Secret Sharing Scheme (SSS) ===");

  if (seed.length > 63) {
    console.error("Seed size more than 63 bytes is unsupported. Exiting...");
    return;
  }

  const sssTotalShares = parseInt(await question("Total Number of Shares: "));
  const sssMinShares = parseInt(await question("Minimum Number of Shares: "));

  const extData = new Uint8Array(64);
  extData.set(seed, 0);
  extData[seed.length] = 0x80; // int (end of data)

  const shares = (
    await sss.createShares(extData, sssTotalShares, sssMinShares)
  ).map((x) => u8aToHex(x));

  console.log("SSS Secret Shares:\n");

  let shareNo = 1;

  for (const share of shares) {
    console.log(`${shareNo}.  ${share}\n`);
    shareNo++;
  }

  const minSharesHex = shares.slice(0, sssMinShares);

  const seedFromSSSWithPadding = await sss.combineShares(
    minSharesHex.map((x) => hexToU8a(x)),
  );

  const indexOf0x80 = seedFromSSSWithPadding.lastIndexOf(0x80);

  const seedFromSSS = seedFromSSSWithPadding.subarray(0, indexOf0x80);

  if (u8aToHex(seedFromSSS) !== u8aToHex(seed)) {
    console.error("Seed recovery check failed.");
  }

  const metadata = JSON.stringify({
    version: "1.0",
    nacl_public_key: u8aToHex(publicKey),
    nacl_nonces: nonces.map((n) => u8aToHex(n)),
    signatures: signatures.map((s) => u8aToHex(s)),
    sign_algo: "secp256k1",
    content_encoding: "base64",
    encryption: "xsalsa20-poly1305, tweetnacl.js",
    sss_total_shares: sssTotalShares,
    sss_minimum_shares: sssMinShares,
  });

  console.log(`\nMetadata:\n\n${metadata}\n`);

  console.log(`Uploading ${files.length} files...`);

  const cid = await storage.put(files, {
    name: await question("Folder/Directory Name: "),
  });

  console.log(`\nContent added with IPFS CID: ${cid}\n`);

  console.log(
    `Links:\n\nhttps://cloudflare-ipfs.com/ipfs/${cid}\n\nhttps://${cid}.cf-ipfs.com\n\nhttps://${cid}.ipfs.dweb.link\n`,
  );
};

export default upload;
