// import 'mocha';
import {Wallet} from "../src";
import {Utils} from "../src";
import hardhat from "hardhat";
import assert from 'assert';

// const Config = require('./config').wallet;

suite('##Wallet Hardhat', async function() {
    this.timeout(20000);
    let provider = hardhat.network.provider;
    let erc20Address = '';
    let accounts: string[];
    const wallet = new Wallet(provider); 
    
    suiteSetup(async function(){
        accounts = await wallet.accounts;
    })
    test('wallet.utils', async function(){
        assert.strictEqual(
            wallet.utils.stringToBytes32(['a','b','c']).toString(),
            [
                '0x6100000000000000000000000000000000000000000000000000000000000000',
                '0x6200000000000000000000000000000000000000000000000000000000000000',
                '0x6300000000000000000000000000000000000000000000000000000000000000'
            ].toString()
        );
    })
    test('wallet.setPrivateKey', async function(){
        let initBlockNum = await wallet.getBlockNumber();
        wallet.defaultAccount = accounts[0];
        assert.strictEqual(wallet.address, accounts[0]);
        let wallet2 = new Wallet(provider);
        wallet2.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b1';
        assert.strictEqual(wallet2.address, '0x80E2fE38D90608b4Bc253C940dB372F44f290816');    
        assert.strictEqual((await wallet2.balance).toNumber(), 0);

        await wallet.send(wallet2.address, 2);
        let blockNum = await wallet.getBlockNumber();
        assert.strictEqual(blockNum, initBlockNum +1);
        assert.strictEqual((await wallet.balanceOf(wallet2.address)).toNumber(), 2);
        assert.strictEqual((await wallet2.balance).toNumber(), 2);
    })
    test('Sign Transaction', async function(){
        accounts = await wallet.accounts;        
        wallet.defaultAccount = accounts[0];
        let wallet2 = new Wallet(provider);
        let account = wallet2.createAccount();
        await wallet.send(wallet2.address, 20);        
        assert.strictEqual((await wallet2.balance).toNumber(), 20);

        let token = wallet2.token('');
        await token.deploy({
            name: 'oswap', 
            symbol: 'oswap', 
            minter: wallet2.address});
        await token.mint({
            address: wallet2.address, 
            amount: 100
        });
        assert.strictEqual((await token.balance).toNumber(), 100);
        // let tx = await token._mint({
        //     address: wallet.address, 
        //     amount: 100
        // });        
        // let signedTx = await wallet2.signTransaction(tx);
        // await wallet2.sendSignedTransaction(signedTx);        
        // assert.strictEqual((await token.balanceOf(wallet.address)).toNumber(), 100);
    });
    test('setBlockTime', async function(){        
        let block1 = await wallet.getBlock('latest');
        await wallet.setBlockTime(Utils.toNumber(block1.timestamp) + 60);
        let block2 = await wallet.getBlock('latest');        
        assert.strictEqual((Utils.toNumber(block1.timestamp) + 60), Number(block2.timestamp))
    });
    test('Erc20.deploy', async function(){
        // assert.strictEqual(blockNum, 1);
        wallet.defaultAccount = accounts[0];
        assert.strictEqual(wallet.address, accounts[0]);        
        let erc20 = wallet.token('');// new Erc20(wallet);
        erc20Address = await erc20.deploy({
            name: 'DUMMY Token', symbol: 'DUMMY'
        }); 
        assert.strictEqual(await erc20.symbol, 'DUMMY');
        assert.strictEqual(await erc20.name, 'DUMMY Token');        
        assert.strictEqual(await erc20.decimals, 18);        
    }) 
    test('Token Info', async function(){
        let result = await wallet.tokenInfo(erc20Address);
        assert.strictEqual(result.name, 'DUMMY Token');
    });
    test('Erc20.mint', async function(){
        let erc20 = wallet.token(erc20Address);
        let fromBlock = await wallet.getBlockNumber();
        await erc20.mint({
            address: accounts[1], 
            amount: 1001
        });
        assert.strictEqual((await erc20.totalSupply).toNumber(), 1001);
        assert.strictEqual((await erc20.balanceOf(accounts[1])).toNumber(), 1001);        
        let events = await erc20.scanEvents(fromBlock, 'latest', ['Transfer']);
        let event = events[0];        

        assert.strictEqual(wallet.utils.fromWei(event.data.value), '1001');
        events = await wallet.scanEvents({fromBlock: fromBlock, toBlock: 'latest', topics: erc20.getAbiTopics(['Transfer']), events: erc20.getAbiEvents()});
        event = events[0];        
        assert.strictEqual(wallet.utils.fromWei(event.data.value), '1001');
    });
    test('Erc20.transfer', async function(){
        let erc20 = wallet.token(erc20Address);
        wallet.defaultAccount = accounts[1];
        let trx = await erc20.transfer({
            address: accounts[0], 
            amount: 101
        });
        assert.strictEqual((await erc20.balanceOf(accounts[0])).toNumber(), 101);
    })
    test("Erc20.events", async function(){
        let block = await wallet.getBlockNumber();        
        let erc20 = wallet.token(erc20Address);
        let events = await erc20.scanEvents(block, block, ['Transfer']);        
        let event = events[0];        
        assert.strictEqual(event.data.from, accounts[1]);
        assert.strictEqual(event.data.to, accounts[0]);
    })
    test('Erc20.approve', async function(){
        let erc20 = wallet.token(erc20Address);
        wallet.defaultAccount = accounts[1];
        await erc20.approve({
            spender: accounts[0], 
            amount: 100001
        });
        assert.strictEqual((await erc20.allowance({
            owner: accounts[1], 
            spender: accounts[0]
        })).toNumber(), 100001);
    })
    test('Wallet.signMessage', async function(){
        assert.strictEqual(wallet.address, accounts[1]);
        let sig = await wallet.signMessage('hello');        
        let verified = await wallet.verifyMessage(wallet.address, 'hello', sig);
        assert.strictEqual(verified, true);
        let address = await wallet.recoverSigner('hello', sig);
        assert.strictEqual(address, accounts[1]);
    })  
    test('Wallet.send ETH', async function(){
        wallet.defaultAccount = accounts[2];
        assert.strictEqual((await wallet.balance).toNumber(), 10000);
        await wallet.send(accounts[3], 2);
        assert.strictEqual((await wallet.balanceOf(accounts[3])).toNumber(), 10002);        
    })    
})
/*
suite('##Wallet', function() {
    this.timeout(20000);
    const wallet = new Wallet(Config.provider,  [
        {
            address: '',//'0x80E2fE38D90608b4Bc253C940dB372F44f290816',
            privateKey: 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b1'              
        },
        {
            address: '',//'0x3E38C203a196b1bB1bb90016A984AD9578910896',
            privateKey: 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b2'
        },
        {
            address: '',//'0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD',
            privateKey: 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b3'
        }
    ]);    
    const token = wallet.token('0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4');
    suiteSetup(async function(){

    })
    test ('wallet.accounts', async function(){
        let accounts = await wallet.accounts;
        assert.strictEqual(accounts[0], '0x80E2fE38D90608b4Bc253C940dB372F44f290816');
        assert.strictEqual(accounts[1], '0x3E38C203a196b1bB1bb90016A984AD9578910896');
        assert.strictEqual(accounts[2], '0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD');
    })        
    test ('wallet.signMessage', async function(){
        wallet.defaultAccount = '0x80E2fE38D90608b4Bc253C940dB372F44f290816';
        let sig = await wallet.signMessage('hello');        
        let verified = await wallet.verifyMessage(wallet.address, 'hello', sig);
        assert.strictEqual(verified, true);

        wallet.defaultAccount = '0x3E38C203a196b1bB1bb90016A984AD9578910896';        
        verified = await wallet.verifyMessage(wallet.address, 'hello', sig);
        assert.strictEqual(verified, false);
    })        
    test('set private key, check address', async function() {        
        let wallet = new Wallet();
        wallet.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b1'        
        assert.strictEqual(wallet.address, '0x80E2fE38D90608b4Bc253C940dB372F44f290816');
    });
    test('wallet.balance', async function() {
        wallet.defaultAccount = '0x80E2fE38D90608b4Bc253C940dB372F44f290816';        
        let balance = await wallet.balance;
        assert.strictEqual(balance.eq((await wallet.balanceOf('0x80E2fE38D90608b4Bc253C940dB372F44f290816'))), true);
    });
    test('wallet.send 0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD => 0x3E38C203a196b1bB1bb90016A984AD9578910896', async function() {        
        const wallet1 = new Wallet(Config.provider);
        wallet1.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b2'// address: 0x3E38C203a196b1bB1bb90016A984AD9578910896
        const wallet2 = new Wallet(Config.provider);
        wallet2.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b3' //address: 0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD
        let balance1 = await wallet1.balance;
        let balance2 = await wallet2.balance;
        let balance = balance1.plus(0.00001);
        await wallet2.send(wallet1.address, 0.00001);
        balance1 = await wallet1.balance;
        balance2 = await wallet2.balance;
        assert.strictEqual(balance1.eq(balance), true);        
    });    
    test("token.name = OpenSwap", async function(){ 
        assert.strictEqual(await token.name, 'OpenSwap');
    })
    test("token.decimals = 18", async function(){ 
        assert.strictEqual(await token.decimals, 18);
    })
    test("token.totalSupply = 10000", async function(){ 
        let totalSupply = await token.totalSupply;        
        assert.strictEqual(totalSupply.eq(10000), true);
    })
    test("token.balance = 0.11", async function(){
        let balance = await token.balance;
        assert.strictEqual(balance.eq(0.1099), true);
    })
    test("token.balanceOf('0x80E2fE38D90608b4Bc253C940dB372F44f290816')", async function(){ 
        //https://kovan.etherscan.io/token/0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4?a=0x80E2fE38D90608b4Bc253C940dB372F44f290816
        let balance = await token.balanceOf('0x80E2fE38D90608b4Bc253C940dB372F44f290816');
        assert.strictEqual(balance.eq(0.1099), true);
    })
    let txHash = '';
    test("token.transfer", async function(){ 
        const wallet1 = new Wallet(Config.provider);
        wallet1.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b2'// address: 0x3E38C203a196b1bB1bb90016A984AD9578910896
        const wallet2 = new Wallet(Config.provider);
        wallet2.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b3' //address: 0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD

        let token1 = wallet1.token('0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4');
        let token2 = wallet2.token('0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4');
        let balance1 = await token1.balance;
        let balance2 = await token2.balance;
        let balance = balance1.plus(0.00001);
        let tx = await token2.transfer({
            address: wallet1.address, 
            amount: 0.00001
        });
        txHash = tx.transactionHash;
        assert.strictEqual(balance.eq(await token1.balance), true);
    })
    test("token.events", async function(){
        let block = await wallet.getBlockNumber();        
        let events = await token.scanEvents(block - 10, block, ['Transfer']);        
        let event = events.find(event => event.transactionHash == txHash);
        assert.strictEqual(event.data.from, '0xefffE5b341471ff7002f2a38f8eC31cBfE11b9FD');
        assert.strictEqual(event.data.to, '0x3E38C203a196b1bB1bb90016A984AD9578910896');
    })
})
*/
/*
suite('##Wallet AWS KMS', async function() {   
    this.timeout(40000);
    const wallet = new Wallet(Config.provider);    
    const kmsWallet = new Wallet(Config.provider, Config.kmsAccount);        

    suiteSetup(async function(){        
        await kmsWallet.initKMS();
    })
    test ('KMS address', async function(){        
        assert.strictEqual(kmsWallet.address, '0xf4a4e7add5bda8acc049fae3edd97ff90095c3d1');
    });    
    test ('KMS Sign Message', async function(){
        let sig = await kmsWallet.signMessage('hello');        
        let verified = await kmsWallet.verifyMessage(kmsWallet.address, 'hello', sig);
        assert.strictEqual(verified, true);
    })
    test ('KMS send ETH', async function(){        
        wallet.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b2'// address: 0x3E38C203a196b1bB1bb90016A984AD9578910896                
        assert.strictEqual(wallet.address, '0x3E38C203a196b1bB1bb90016A984AD9578910896');
        let walletBalance = await wallet.balance;
        let expectedWalletbalance = walletBalance.plus(0.0001);
        let tx = await kmsWallet.send(wallet.address, 0.0001);                
        assert.strictEqual(expectedWalletbalance.eq(await wallet.balance), true);
    })    
    test("KMS send token", async function(){
        wallet.privateKey = 'd447c9ae6e1e19910a4035c8acfd0a7facdad2c86c7f42050a694bc25a8e66b2'// address: 0x3E38C203a196b1bB1bb90016A984AD9578910896
        assert.strictEqual(wallet.address, '0x3E38C203a196b1bB1bb90016A984AD9578910896');
        let walletToken = wallet.token('0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4');
        let kmsToken = kmsWallet.token('0xbe62ba98f5d671445ac19e22b7b99cd6c969fdc4');        
        let walletBalance = await walletToken.balance;        
        let kmsBalance = await kmsToken.balance;
        let balance = walletBalance.plus(0.0001);        
        let tx = await kmsToken.transfer({
            address: wallet.address, 
            amount: 0.0001
        });
        assert.strictEqual(balance.eq(await walletToken.balance), true);
    })
})
*/