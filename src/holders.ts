import mongoose from 'mongoose';
import {createAdditions} from './controllers/holderController';
const uri: string = "mongodb://jeevanjot:kjwebrkbwe34523@mongodb.ex-genievot.svc.cluster.local:27017/token_holders?authSource=token_holders&readPreference=primary&appname=MongoDB%20Compass&ssl=false";


mongoose.connect(uri, (err: any) => {
  if(err) {
    console.log(err.message)
  } else {
    console.log("Successfully Connected to MongoDB.")
    Holder.count({}, (err: any, count: any) => {
      if(err) {
        console.log(err)
      }
      if(count != 21016) {
        console.log("Starting to add DB...")
        Holder.collection.drop();
        createAdditions()
      }
    })
  }
});

export const holderSchema = new mongoose.Schema({
  hash: { type: String, required: true },
  eth_address: { type: String, required: true},
  balance: { type: String, required: false },
  leaf_index: { type: Number, required: true },
  // migrated: [{ type: Boolean, required: true }], // check from contract
  ae_address: { type: String, required: false}
});

const Holder = mongoose.model('Holder', holderSchema);

export default Holder;