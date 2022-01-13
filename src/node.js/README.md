## Node.js Implementation of Secret Diary Handover

<b>Project Status: Unaudited, Alpha</b>

```sh
# Install npm packages
npm install
# Run the program
npm start
```

### Note:

- [Web3.storage](https://web3.storage) service is used for uploading to IPFS nodes and for pinning.
- `TOKEN` environment variable is required to access [Web3.storage](https://web3.storage) service. You can get a token from [Web3.storage](https://web3.storage) website.
- The program asks for the token from stdin if not provided as an environment variable.
- Content Recovery depends on [dweb.link](https://dweb.link/api/v0) IPFS HTTP Gateway API. You can change it in [src/recover.ts](./src/recover.ts) file if you wish to use a different gateway.