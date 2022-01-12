import { hexToU8a, u8aToHex } from "@polkadot/util";
import * as IPFS from "ipfs-http-client";

import { question } from "./utils";
import sss from "../../sss-wasm/lib";
import { generateKeyPair } from "./crypt";
import { base64Decode, naclDecrypt } from "@polkadot/util-crypto";

export const recover = async () => {
  const minShareCount = parseInt(
    await question("Number of Minimum Secret Shares: "),
  );

  const shares = [];

  for (let i = 1; i <= minShareCount; i++) {
    const share = hexToU8a(
      (await question(`Paste Share Number ${i}: `)).trim(),
    );

    shares.push(share);
  }

  const seedFromSSSWithPadding = await sss.combineShares(shares);

  const indexOf0x80 = seedFromSSSWithPadding.lastIndexOf(0x80);

  const secret = seedFromSSSWithPadding.subarray(0, indexOf0x80);

  const { secretKey } = await generateKeyPair(secret);

  const url = "https://dweb.link/api/v0";
  const ipfs = IPFS.create({ url });
  const cid = await question("IPFS CID: ");

  const files = ipfs.ls(cid);

  let i = 1;

  for await (const file of files) {
    console.log(
      `\n${i}. File CID: ${file.cid} -- Name: ${file.name} -- Size: ${file.size} bytes`,
    );

    const nonce = hexToU8a(
      (await question(`\nPaste nonce for file ${i}: `)).trim(),
    );

    for await (const content of ipfs.cat(file.cid)) {
      const decrypted = naclDecrypt(
        base64Decode(new TextDecoder().decode(content)),
        nonce,
        secretKey,
      );

      console.log("\nDecrypted:\n");

      console.log(decrypted && new TextDecoder().decode(decrypted));

      break;
    }

    i++;
  }
};

export default recover;
