import { Request, Response } from 'express';
import Holder from './../holders';

import MerkleTree from '../createMerkleTree';
import * as ae from '../aeternitySdk';

// import data from '../data/final-token-holders-sorted.json';
import data from '../data/final-token-holders-sorted-test.json';

console.log(Holder)

var data_to_array: string[] = []
data_to_array = Object.entries(data).map((e) => ( JSON.stringify({ [e[0]]: e[1] }).replace(/{|}|"/g, '').toUpperCase()));
var tree = new MerkleTree(data_to_array)
ae.initNode()




// Endpoints...
// GET - / - tree status, Root hash of merkel tree & number of leafs/nodes.
// GET - /info/<eth_address> - get info from eth address.
// GET - /hash/<index> - get hash from leaf index.
// GET - /siblings/<index> - get intermediary hashes (array) by given leaf index.
// POST - /validate - Check validity of request.
// POST - /migrate - Migrate tokens.

export let rootHash = (req: Request, res: Response) => {
  return res.send({"status": true, "tree": {"root": tree.getRootHash(), "length": tree.leaves.length}});
}
export let getInfoByEthAddress = async (req: Request, res: Response) => {
  
    let holder = Holder.findOne({where: {eth_address: req.params.ethAddress.toUpperCase()}}).then(async (holder: any) => {
      try {
        var is_migrated = await ae.checkMigrated(holder.dataValues.eth_address)
        var migrated = {'migrated': is_migrated}
        var _obj = {
          "index": holder.dataValues.leaf_index,
          "hash": holder.dataValues.hash,
          "tokens": holder.dataValues.balance,
          "migrateTxHash": holder.dataValues.migrateTxHash
        }
        var holder_obj = {..._obj, ...migrated}
        res.send(holder_obj)
      } catch (error) {
        console.trace(error)
      }  
    }).catch((e: any) => {
      console.trace(e)
    })
  
}
export let getHashByIndex = (req: Request, res: Response) => {
    let holder = Holder.findOne({where: {leaf_index: req.params.index}}).then((holder: any) => {
    try {
      var holder_obj = {"index": holder.dataValues.leaf_index, "hash": holder.dataValues.hash}
      res.send(holder_obj)
    } catch (error) {
      console.trace(error)
    }
    }).catch((e: any) => {
      console.trace(e)
    })
}
  

export let getSiblingsByIndex = (req: Request, res: Response) => {
    let holder = Holder.findOne({where: {leaf_index: req.params.index}}).then((holder: any) => {
    try {
      var holder_obj = {"status": true, "hashes": holder.dataValues.siblings}
      res.send(holder_obj)
    } catch (error) {
      console.trace(error)
    }
    }).catch((e: any) => {
      console.trace(e)
    })
}

export let validateRequest = async (req: Request, res: Response) => {
  console.log("validate Request")
  console.log(req.body.ethAddress)
  console.log(req.body.balance)
  console.log(req.body.index)
  console.log(req.body.hashes)
  let validated = await ae.validateValues(req.body.ethAddress, req.body.balance, req.body.index, req.body.hashes)
  res.send({"status": true, "exists": validated});
}

export let migrate = async (req: Request, res: Response) => {
  let userValues = await get_user_by_eth_pk(req.body.ethPubKey)
  let result = await ae.migrate(userValues.balance, req.body.aeAddress, userValues.leaf_index, userValues.siblings, req.body.signature)
  try {
    await Holder.update({
      migrateTxHash: result
    }, {
      where: {leaf_index: userValues.leaf_index}
    })
  } catch(e) {
    console.trace(e)
  }
  res.send({"status": true, "result": result});
}

// // For additionals purposes...
// // export let getIndexByHash = (req: Request, res: Response) => {
// //     let holder = Holder.find({hash: req.params.hash.toUpperCase()}, (err: any, holder: any) => { 
// //         if (err) {
// //         res.send(err)
// //       } else {
// //         try {
// //           var holder_obj = {"index": holder[0]._doc.leaf_index, "hash": holder[0]._doc.hash}
// //           res.send(holder_obj)
// //         } catch (error) {
// //           console.log(error)
// //         } 
// //       }
// //     }) 
// // }




// Find user by eth id
async function get_user_by_eth_pk(_eth_address: String) {
  let user = await Holder.findOne({ where: { eth_address: _eth_address  } })
  return user.dataValues
}



//Add data to DB!
var i = 0
export async function createAdditions() {
  if(i < data_to_array.length) {
    var body = {
      hash: tree.hashFunction(data_to_array[i]),
      eth_address: data_to_array[i].split(':')[0],
      balance: data_to_array[i].split(':')[1],
      siblings: tree.getProof(data_to_array[i]),
      leaf_index: i,
      migrateTxHash: ''
    }
    var holder = new Holder(body)

    console.log(await holder.save())
    i++
    createAdditions()
  }
}



// logs




// console.log("data_to_array--")
// console.log(data_to_array)
// console.log("data_to_array length--")


// var values = Object.values(data);
// var sumValues = 0
// for (let index = 0; index < values.length; index++) {
//   // console.log(index)
//   sumValues = BigInt(values[index]) + (sumValues+'n');
// }
// console.log("sumValues--")
// console.log(sumValues)
// console.log("Get Tree--")
// console.log(tree.getTree())
// console.log("Get Root Hash--")
// console.log(tree.getRootHash())
// console.log("Get Index--")
// console.log(tree.getIndexFromHash('310E3A573B9299000F054D25F0D301CD314C081E4C4E03E8CC07B660B8B4CC95'))
