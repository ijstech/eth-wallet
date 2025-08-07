import 'mocha';
import {Wallet, Utils, Types, IAccount} from "../src";
import hardhat from "hardhat";
import * as assert from 'assert';
import { HashTypedData } from './contracts';

suite('##Wallet Sign Typed Data', async function() {
    this.timeout(20000);
    let provider = hardhat.network.provider;
    let accounts: string[];
    let wallet = new Wallet(provider); 
    let hashTypedData: HashTypedData;

    suiteSetup(async function(){
        accounts = await wallet.accounts; 
    })
    test('Check Signer', async function(){
        wallet.defaultAccount = accounts[0];
        hashTypedData = new HashTypedData(wallet);
        let address = await hashTypedData.deploy();
        let chainId = await wallet.getChainId();
        let domain: Types.IEIP712Domain = {
            name: "Triplay", 
            version: "0.1.0", 
            chainId: chainId, 
            verifyingContract: address
        }
        let customTypes: Types.EIP712TypeMap = {
            Unstake: [
                { "name": "chainId", "type": "uint256" },
                { "name": "requestId", "type": "uint256" },
                { "name": "player", "type": "address" },
                { "name": "amount", "type": "uint256" }
            ]
        }
        let primaryType = 'Unstake';
        let message = {
            chainId: chainId,
            requestId: 1,
            player: accounts[0],
            amount: Utils.toDecimals(1000).toFixed()
        }

        let wallet2 = new Wallet(provider, {
            address: '0x80E2fE38D90608b4Bc253C940dB372F44f290816',
            privateKey: 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b1'
        })
        // let data2 = Utils.constructTypedMessageData(domain, customTypes, primaryType, message);
        let data: any = {
            types: customTypes,
            primaryType: primaryType,
            domain: domain,
            message: message
        };
        let signature = await wallet2.signTypedDataV4(data);
        
        let paramsHash = await hashTypedData.hashUnstakeParams({
            amount: Utils.toDecimals(1000),
            player: accounts[0],
            requestId: 1
        })
        let signerFromWallet = await wallet2.recoverTypedSignatureV4(data, signature);
        let signerFromContract = await hashTypedData.getSigner({
            paramsHash: paramsHash,
            signature: signature
        })
        assert.strictEqual(signerFromWallet, wallet2.address);
        assert.strictEqual(signerFromContract, wallet2.address);
    })
});