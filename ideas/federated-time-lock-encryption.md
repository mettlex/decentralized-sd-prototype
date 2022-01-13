## Federated Time-Lock Encryption Scheme (Draft)

### Decentralized Time:

- The latest block-time can be retrieved from some existing decentralized blockchain networks, e.g. Ethereum, Solana etc.

- Currently in Ethereum, the average block time is between 12 to 14 seconds ([reference](https://ethereum.org/en/developers/docs/blocks/#:~:text=In%20Ethereum%2C%20the%20average%20block%20time%20is%20between%2012%20to%2014%20seconds)). In Solana, the current implementation sets block time to 800ms ([reference](https://docs.solana.com/cluster/synchronization#:~:text=The%20current%20implementation%20sets%20block%20time%20to%20800ms.)).

- These decentralized networks have public HTTP RPC endpoints where anyone can query for the latest block information.

- The latest block object contains [unix timestamp](https://en.bitcoin.it/wiki/Block_timestamp).

- The latest block timestamp from any relatively-fast blockchain network will provide a decentralized way to get a little delayed current date-time which is workable for a time-lock/time-lapse encryption scheme. Alternative to this can be any [Network Time with a Consensus on Clock](https://eprint.iacr.org/2019/1348).


### Key Servers with Private Storage:
#### 1. Key Storing Mechanism:

- A server will have a time state synced with the decentralized source.
- The server will receive 2 secret keys & an upcoming date-time from a client "A".
- The server will generate random bytes (nonce) on every request.
- The server will encrypt the 2nd secret key with the new secret key which is derived from the 1st key and the random bytes.
- The server will use a hash function to get a digest from the random bytes.
- The server will save the digest, the encrypted cipher text of the 2nd key and the date-time in its centralized-private storage and send the random bytes to the client "A".

#### 2. Client-side Encryption:  

- The client "A" will encrypt their secret data "S" with the 2nd secret key. It'll produce a cipher text "C".
- The client "A" will share the upcoming date-time, the 1st key, the cipher text "C" & the random bytes with a client "B".

#### 3. Key Recovery:

- The client "B" will send the 1st key & the random bytes to the key server.
- The server will create a new digest from the received random bytes to check and locate the data in its storage.
- The server will check the date-time retrieved from its own storage against the current date-time from the decentralized source to ensure the client "A"s desired date-time has passed.
- If the date-time has passed, the server will send the encrypted cipher text of the 2nd key from its storage to the client "B".
- The client "B" can retrieve the 2nd key after decrypting with the 1st key & the random bytes.
- Now the client "B" can decrypt the cipher text "C" with the 2nd key to get the secret data "S".


### Federated Model:

- The client "A" will use multiple servers that follow the same protocol.
- Each server will generate different random bytes so their storage won't have the same data.
- The client "B" can use any of the servers to retrieve the 2nd key.

### Decentralized Secret Sharing:

- The federated time-lock encryption scheme can be used as an additional feature with the decentralized secret sharing.