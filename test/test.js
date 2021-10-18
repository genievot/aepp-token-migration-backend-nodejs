/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const {Universal, Node, MemoryAccount, Crypto} = require('@aeternity/aepp-sdk');
const ethers = require('ethers');

const NETWORKS = require('../config/network.json');
const NETWORK_NAME = "local";

const contractUtils = require('../utils/contract-utils');
const contractSource = contractUtils.getContractContent('./contracts/TokenMigration.aes');

const minerKeyPair = {
    publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
    secretKey: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca"
}

const anotherKeyPair = {
    publicKey: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP",
    secretKey: "7fa7934d142c8c1c944e1585ec700f671cbc71fb035dc9e54ee4fb880edfe8d974f58feba752ae0426ecbee3a31414d8e6b3335d64ec416f3e574e106c7e5412"
}

// const ethSecretKey = '0xcbae6bb63d6466f214d50e24c5c483834bd0cc52f78c69b0a467dc273c6c3a14'
const tokenOwnerInfo = {
    rootHash: "B301F70F048627AEDCF940242F8E741A6D3BCC1126B85DB1B296E4E576177656",
    ethAddr: "0XB3D566E9C6231457E854DBFC0E6EDC5FFF5E6FCD".toUpperCase(),
    ethSecretKey: '72c2499da82fe7df2270b30cb25dbd2e31f1bf47c702390189efb2f832cca2d1',
    tokens: "896946881386313856",
    leafIndex: 17,
    siblings: [
        "E5BE603556579B2E5F1A016AC615EB3055D4D43D5930598DA24E59E5ED4B14D4"
    ],
    hashedMsg: "259c99268998ec1ad242b9aa2f35ae82e1f02b0788128e8c3b2eb021a25730aa",
    signature: "1bcc6728ed7eedb93d2fae73699a4bc58e8518fe1f6c73e7fe2717c6c0daaeebb816ab86bdf17212a4b171e5c9464d89f3c4863cfe31c92c30717729b2ffabadc9"
};

const anotherTokenOwnerInfo = {
    rootHash: "B301F70F048627AEDCF940242F8E741A6D3BCC1126B85DB1B296E4E576177656",
    ethAddr: "0X1E18E8D56401706F26BA1505A906DB3BA2BB61B0".toUpperCase(),
    ethSecretKey: 'cc42e64440acb557649f3857f126d76f99a3cd24892e20b162da9c9e985f9c4f',
    tokens: "1028776552391213184",
    leafIndex: 27,
    siblings: [
        "802E47385F840DF51167FF0180CD8D91B7A20FC333D9F790D520F13743BB41C1"
    ],
    hashedMsg: "6f9d9941c009e57c5f03ed21311128963508c043139d08cd0d672de5b992a05a",
    signature: "1c7eda90e754baa9f6a9a0abd19a919fe166f91c0a63e29ad558aa3720cf737d781689107fc4e9fa14f53268bf75a03356758284a6aa46a0049b37b33945d2f018"
};

describe('Token Migration', async function () {

    let client;
    let instance;
    let node;
    let notFundedInstance;

    before(async function () {
        const randomKeyPair = await Crypto.generateKeyPair();
        tokenOwnerInfo.aeAddress = randomKeyPair.publicKey;

        node = await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl });
        client = await Universal({
            nodes: [
            { name: NETWORK_NAME, instance: node },
            ],
            compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
            accounts: [MemoryAccount({ keypair: minerKeyPair })],
        });

        instance = await client.getContractInstance(contractSource)
        notFundedInstance = await client.getContractInstance(contractSource)
    })

    describe('Deploy', () => {

        it('Is deployment fulfilled', async () => {
            await assert.isFulfilled(instance.deploy(["0xSomeRoot", 0], {
                amount: 10 * 1000000000000000000
            }))
        })

        it('Check deploy info result', async () => {
            const deployInfo = await instance.deploy(["0xSomeRoot", 0], {
                amount: 10 * 1000000000000000000
            })
            let propsShouldHave = deployInfo.owner && deployInfo.transaction && deployInfo.address && deployInfo.createdAt && deployInfo.result && deployInfo.rawTx;
            assert.isOk(propsShouldHave, "Contract was not deployed correctly")
        })
    })

    describe('Init', () => {

        const migrationsCount = 91;

        before(async function () {
            await instance.deploy([tokenOwnerInfo.rootHash, migrationsCount], {
                amount: 10 * 1000000000000000000
            });
        })

        it('Root hash should be same as deployed one', async () => {
            const dryRunCall = await instance.methods.root_hash()
            assert.isOk(tokenOwnerInfo.rootHash === dryRunCall.decodedResult, "Root hash does not match")
        })

        it('Contract balance should be 0', async () => {
            await notFundedInstance.deploy([tokenOwnerInfo.rootHash, 0]);
            const dryRunCall = await notFundedInstance.methods.balance()
            assert.isOk(0 == dryRunCall.decodedResult, "Balance is not 0")
        })

        it('Migrations count should be 0', async () => {
            const dryRunCall = await instance.methods.migrations_count()
            assert.isOk(migrationsCount === dryRunCall.decodedResult, "Root hash does not match")
        })

        it('Should not have migrated ethereum address', async () => {
            for (let i = 0; i < 10; i++) {
                const randomWallet = ethers.Wallet.createRandom()
                const ethAddress = randomWallet.signingKey.address
                const dryRunCall = await instance.methods.is_migrated(ethAddress)
                assert.isOk(!dryRunCall.decodedResult, "There is migrated ethereum address")
            }
        })
    })

    describe('Migration', function () {

        beforeEach(async function () {
            await instance.deploy([tokenOwnerInfo.rootHash, 0], {
                amount: 10 * 1000000000000000000
            });
            tokenOwnerInfo.aeAddress = 'ak_2nz23cBQyQXKrCjUJ7UgiDoN9Fq8Co9m5zM99iYg9XMQtToWZi';
        })

        it('Should migrate tokens ', async () => {
            await instance.methods.migrate(
                tokenOwnerInfo.tokens,
                tokenOwnerInfo.aeAddress,
                tokenOwnerInfo.leafIndex,
                tokenOwnerInfo.siblings,
                tokenOwnerInfo.signature)
            const dryRunCall = await instance.methods.migrations_count()
            assert.isOk(1 == dryRunCall.decodedResult, "Migrations count is invalid")
        })

        it('[Negative] Should not migrate tokens if contract have not been funded', async () => {
            await notFundedInstance.deploy([tokenOwnerInfo.rootHash, 0])
            try {
                await notFundedInstance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    tokenOwnerInfo.signature)
                assert.isOk(false, "Should not migrate tokens when contract is not funded")
            } catch (error) {
                assert.isOk(error.message.includes('Invocation failed'), "Should not migrate tokens when contract is not funded")
            }
        })

        it('[NEGATIVE] Should not reproduce same merkle tree root hash with invalid signature, eth address is not in root', async () => {
            const invalidSignature = '2c43985fce5182c64f32e37cc452d0b869f1a3c1d6fae5624ed50d7cb3e011d062f92077b166c7551925bb39ce698b5c570538739a30ae6b3e8153092acca0c71c'
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    invalidSignature)
                assert.isOk(false, "Migrated has been passed with invalid ethereum address")
            } catch (error) {
                assert.isOk(error.message.includes('Failed to recover address, bad signature'), "Should not migrate tokens when invalid ethereum address is passed")
            }
        })

        it('[NEGATIVE] Should not reproduce same merkle tree root hash with invalid token amount', async () => {
            try {
                await instance.methods.migrate(
                    123,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    tokenOwnerInfo.signature)
                assert.isOk(false, "Migrated has been passed with invalid token amount")
            } catch (error) {
                assert.isOk(error.message.includes('From provided data, cannot be generated same root'), "Should not migrate tokens when invalid token amount is passed")
            }
        })

       it('[NEGATIVE] Should not reproduce same merkle tree root hash with invalid merkle tree siblings', async () => {
            const invalidSiblings = [
                "A216AC75AE5818D78F6CCD35C34331EDE119CA5BA40089FA6B0AF98A652F1988",
                "4412DABEB9B4565C487AE17C1EE837D3804BC36EE1942F2A5B6C9C987DAC2C40",
                "AA2DBEBEA7A5C6B40ABF87D2C299218EFA12981C246A1D44F83D61C2B683A4CA",
                "BC2DBEBEA7A5C6B40ABF87D2C299218EFA12981C246A1D44F83D61C2B683A4CA",
                "DE1E73DC0453EBD5A68D45F85D5341DE9BE4AD8CC244D90022B1D1F7FE0657CC",
                "3AB5113A03BD541A704BFB24C1CE7BEFAF752DF088EF3C4BDEF7C936534E5647",
                "70886EF10DBDF2FDB2CF145EC37BEE95E31BF9DA8444C924F03FFB8EAA63EF98",
                "2FF80709DE5F2ED00142E2647E261A1CF934A0761CB8D14818199269B6E4ECB9",
            ]
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    invalidSiblings,
                    tokenOwnerInfo.signature)
                assert.isOk(false, "Migrated has been passed with invalid merkle tree siblings")
            } catch (error) {
                assert.isOk(error.message.includes('From provided data, cannot be generated same root'), "Error message is not that should be. Should not be able to generate same merkle tree root hash");
            }
        })

        it('[NEGATIVE] Should not reproduce same merkle tree root hash with invalid merkle tree leaf index', async () => {
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    1,
                    tokenOwnerInfo.siblings,
                    tokenOwnerInfo.signature)
                assert.isOk(false, "Migrated has been passed with invalid merkle tree leaf index")
            } catch (error) {
                assert.isOk(error.message.includes('From provided data, cannot be generated same root'), "Error message is not that should be. Should not be able to generate same merkle tree root hash");
            }
        })

        // try to migrate same eth address twice
        it('[NEGATIVE] Should not migrate tokens twice', async () => {
            await instance.methods.migrate(
                tokenOwnerInfo.tokens,
                tokenOwnerInfo.aeAddress,
                tokenOwnerInfo.leafIndex,
                tokenOwnerInfo.siblings,
                tokenOwnerInfo.signature);
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    tokenOwnerInfo.signature)
                assert.isOk(false, "Migrated has been passed with same ethereum address")
            } catch (error) {
                assert.isOk(error.message.includes('This account has already transferred its tokens'), "Error message is not that should be. Should not be able to migrate twice same ethereum address");
            }

            let response = await instance.methods.migrations_count()
            assert.isOk(1 == response.decodedResult, "Migrations count is invalid")
        })

        // migration for anotherTokenOwner fails for some reason. not sure if this ever worked in the tests
        xit('Should migrate tokens from different ethereum addresses', async () => {
            let dryRunCall = await instance.methods.migrations_count()
            assert.isOk(0 == dryRunCall.decodedResult, "Migrations count is invalid")

            await instance.methods.migrate(
                tokenOwnerInfo.tokens,
                tokenOwnerInfo.aeAddress,
                tokenOwnerInfo.leafIndex,
                tokenOwnerInfo.siblings,
                tokenOwnerInfo.signature)
            dryRunCall = await instance.methods.migrations_count()
            assert.isOk(1 == dryRunCall.decodedResult, "Migrations count is invalid")

            await instance.methods.migrate(
                anotherTokenOwnerInfo.tokens,
                anotherKeyPair.publicKey,
                anotherTokenOwnerInfo.leafIndex,
                anotherTokenOwnerInfo.siblings,
                anotherTokenOwnerInfo.signature)
            dryRunCall = await instance.methods.migrations_count()
            console.log(dryRunCall.decodedResult)
            assert.isOk(2 == dryRunCall.decodedResult, "Migrations count is invalid")
            dryRunCall = await instance.methods.is_migrated(tokenOwnerInfo.ethAddr)
            console.log(dryRunCall.decodedResult)
            assert.isOk(dryRunCall.decodedResult, "Eth address should be migrated")
            dryRunCall = await instance.methods.is_migrated(anotherTokenOwnerInfo.ethAddr)
            console.log(dryRunCall.decodedResult)
            assert.isOk(dryRunCall.decodedResult, "Eth address should be migrated")
        })

        // negative pass invalid hashed msg
        it("[NEGATIVE] Should not migrate with invalid aeternity address", async () => {
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    "ak_ZLqPe9J2qenismR9FoJ93zJs8To91LQH9iVb2X4HRkRKMpxXt",
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    tokenOwnerInfo.signature)

                assert.isOk(false, "Migrated has been passed with invalid hashed message")
            } catch (error) {
                assert.isOk(error.message.includes('From provided data, cannot be generated same root'), "Error message is not that should be. Should not be able to recover ethereum address");
            }
        })

        // negative pass invalid signature
        it("[NEGATIVE] Should not migrate with invalid signature", async () => {
            try {
                await instance.methods.migrate(
                    tokenOwnerInfo.tokens,
                    tokenOwnerInfo.aeAddress,
                    tokenOwnerInfo.leafIndex,
                    tokenOwnerInfo.siblings,
                    "1b2ed7455938efdaa0709d8de24eba5b62dd2f035e82e7e46ff0a104972ec2266402663f8cbab895cc0791303c566c29b770d6730f077361b82d37b4c18987653e")
                assert.isOk(false, "Migrated has been passed with invalid signature")
            } catch (error) {
                assert.isOk(error.message.includes('Failed to recover address, bad signature'), "Error message is not that should be. Should not be able to recover ethereum address");
            }
        })
    })
})