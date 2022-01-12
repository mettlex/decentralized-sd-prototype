import {
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  naclBoxPairFromSecret,
} from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

import { question } from "./utils";

export const generateKeyPair = async (
  seed?: Uint8Array,
): Promise<{
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  seed: Uint8Array;
}> => {
  let seedAlice: Uint8Array;

  if (!seed) {
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
  } else {
    seedAlice = seed;
  }

  // Generate new public/secret keypair for Alice from the supplied seed
  const { publicKey, secretKey } = naclBoxPairFromSecret(seedAlice);

  console.log("Public Key:", u8aToHex(publicKey));

  if (
    (await question("Show Secret Key? Y or N: ")).toLowerCase().startsWith("y")
  ) {
    console.log("Secret Key:", u8aToHex(secretKey));
  }

  return { publicKey, secretKey, seed: seedAlice };
};
