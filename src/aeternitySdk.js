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

export async function checkMigrated(eth_address) {
  try {
  var result = await contract.methods.is_migrated.get(eth_address)
  return result.decodedResult
  } catch(e) {
    console.trace(e)
  }
};


export async function validateValues(ethAddress, balance, index, hashes) {
  try {
    var result = await contract.methods.contained_in_merkle_tree(ethAddress, balance, index, hashes)
    return result.decodedResult
  } catch(e) {
    console.trace(e)
  }
};

export async function migrate(amount, ae_address, leaf_index, siblings, signature) {
  try {
    // Below code (above contract call in this try block) will convert signatures (passed as string) to bytes(65)
    _sinatures_in_bytes = []
    _signature = signature
    for (let index = 0; index < 130; index = index + 2) {
      if (_signature[index] == undefined) {
        _sinatures_in_bytes.push("0x" + "00")
        continue
      }
      const element = _signature[index].toString(16);
      const element2 = _signature[index + 1].toString(16);
      _sinatures_in_bytes.push("0x" + element + element2)
    }
    console.log(_sinatures_in_bytes)


    var result = await contract.methods.migrate(amount, ae_address, leaf_index, siblings, _sinatures_in_bytes)
    return result.decodedResult
  } catch(e) {
    console.trace(e)
  }
};

initNode()