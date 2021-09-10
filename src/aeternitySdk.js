require('dotenv').config({path:__dirname+'/.env'})
const fs = require('fs');
const ContractCode = fs.readFileSync(__dirname + '/migrate.aes', 'utf-8');
const { Universal, Node, MemoryAccount, Ae } = require('@aeternity/aepp-sdk');

const keyPair = {
  "publicKey": process.env.PUBLIC_KEY,
  "secretKey": process.env.PRIVATE_KEY
}
var client_node = null
var contract = null


var queries = null;

export async function initNode () {
  client_node = await Universal({
    nodes: [
      {
        name: 'node',
        instance: await Node({
          url: process.env.NODE_URL,
          internalUrl: process.env.NODE_URL,
        }),
      }],
    accounts: [MemoryAccount({ keypair: keyPair })],
    compilerUrl: process.env.COMPILER_URL
  });

  contract = await client_node.getContractInstance(ContractCode, { contractAddress: process.env.CONTRACT_ADDRESS })
}

export async function checkMigrated(address) {
  var result = await contract.methods.is_migrated.get(address)
  return result.decodedResult
};

initNode()