import 'mocha';
import {Wallet, Utils, Types, MerkleTree} from "../src";
import hardhat from "hardhat";
import * as assert from 'assert';
import { TestWhitelistTree } from './contracts';

suite('##Wallet Merkle Proof', async function() {
    this.timeout(20000);
    let rawData: Record<string, any>[] = [];
    let tree: MerkleTree;
    let provider = hardhat.network.provider;
    let accounts: string[];
    const wallet = new Wallet(provider); 
    let whitelistTree: TestWhitelistTree;
    const abi = [
        {
            type: 'address',
            name: 'account'
        },
        {
            type: 'uint256',
            name: 'amount'
        },
        {
            type: 'uint256',
            name: 'amount2'
        },
        {
            type: 'string',
            name: 'ipfsCid'
        }
    ]

    function randomInt(min: number, max: number) { 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    suiteSetup(async function(){
        accounts = await wallet.accounts;         
        for (let account of accounts) {
            rawData.push({
                account: account,
                amount: randomInt(1, 99999),
                amount2: randomInt(1, 5000),
                ipfsCid: 'ABC'  
            })
        }    
    })
    test('Create tree and set tree root', async function(){
        wallet.defaultAccount = accounts[0];
        tree = Utils.generateMerkleTree(wallet, {
            leavesData: rawData, 
            abi, 
            abiKeyName: 'account'
        });
        whitelistTree = new TestWhitelistTree(wallet);
        let address = await whitelistTree.deploy();
        let root = tree.getHexRoot();
        await whitelistTree.setMerkleRoot(root);
    })

    test('Account 0: Verify tree Proof', async function(){
        wallet.defaultAccount = accounts[0];
        let proofs = Utils.getMerkleProofs(wallet, tree, {
            key: accounts[0]
        });
        let valid = await whitelistTree.verifyMerkleProof2({
            amount1: rawData[0].amount,
            amount2: rawData[0].amount2,
            ipfsCid: rawData[0].ipfsCid,
            proof: proofs[0]
        })
        assert.strictEqual(valid, true);
    })

    test('Account 1: Verify tree Proof', async function(){
        wallet.defaultAccount = accounts[1];
        let proofs = Utils.getMerkleProofs(wallet, tree, {
            key: accounts[1]
        });
        let valid = await whitelistTree.verifyMerkleProof2({
            amount1: rawData[1].amount,
            amount2: rawData[1].amount2,
            ipfsCid: rawData[1].ipfsCid,
            proof: proofs[0]
        })
        assert.strictEqual(valid, true);
    })
});