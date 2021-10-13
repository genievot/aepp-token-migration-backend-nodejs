import express from "express";
import * as holderController from './controllers/holderController';

const app = express();
var port = 3000;

// console.log(holderController.rootHash)
app.get('/', holderController.rootHash);
app.get('/info/:ethAddress', holderController.getInfoByEthAddress);
app.get('/hash/:index', holderController.getHashByIndex);
app.get('/siblings/:index', holderController.getSiblingsByIndex);
app.post('/validate', holderController.validateRequest);
app.post('/migrate', holderController.migrate);

// app.get('/index/:hash', holderController.getIndexByHash); // For additional purposes, You can comment it...


app.listen(port, () => console.log(`Running at ${port}!`))

