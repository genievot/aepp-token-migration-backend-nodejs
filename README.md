# Usage of my project.

### From root directory, run these `commands`
Install all dependencies with `npm i` or `yarn`.
### Inside _src_ directory, create `.env` file and add your values for these variables inside env file.
```
DB_URL=mongodb://jeevanjot:kjweb....
TABLE_NAME = <table_name>
COMPILER_URL=https://latest.compiler.aepps.com
CONTRACT_ADDRESS=ct_eJhrb....
NODE_URL=https://mainnet.aeternity.io
PRIVATE_KEY=52f9....
PUBLIC_KEY=ak_2H4....
```

### Requirements
- Setup `Postgres DB` and use your connection string for above **env's First variable**
- Get the migration contract address `ct_eJhrbPPS4V97VLKEVbSCJFpdA4uyXiZujQyLqMFoYV88TzDe6` or [deploy your own](https://github.com/aeternity/aepp-token-migration-smart-contract/blob/master/contracts/TokenMigration.aes) and add the address in the above **env's CONTRACT_ADDRESS** variable
- Use the Node url for Mainnet (`https://mainnet.aeternity.io`) or Testnet (`https://testnet.aeternity.io`) according to your interactive environment (contract deployment etc.) and add the url to the above **env file**
- Create a set of public and private keys using [aecli](https://github.com/aeternity/aepp-cli-js) or any tool you like and add it in the above **env file**
- I used `node 14` while working on this project. To avoid any breaking in code with current `tsconfig.json` you can use the same version.

### Run the script from _src_ directory
Inside **src** directory, Run `npm run dev`, This will use **nodemon** to run the typescript with `app.ts` as entrypoint.


### `Files` & *Folders* in this repository from *src* directory.
- *data* : Contains token holders data that is used to create merkle tree.
- `controllers/holderController.ts` : Contains logic for the routes to resolve and respond, Also contains function definition to run data addition on MongoDB
- `aeternitySdk.js` : This script contains logic for interacting with Aeternity blockchain using **aepp-sdk**.
- `createMerkleTree.js` : Create the merkle tree for the supplied data.
- `holders.ts` : This script initiate the DataBase (MongoDB) and run Data Additions if they are not there or incorrect in numbers.
- `app.ts` : This script is the **Entrypoint** of my project which handle the routes.
- `migrate.aes` : It is the contract source that backend use as reference to call it's methods.
