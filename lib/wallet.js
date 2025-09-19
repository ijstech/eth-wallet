"use strict";
/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcWallet = exports.Wallet = exports.Web3ModalProvider = exports.MetaMaskProvider = exports.EthereumProvider = exports.toString = void 0;
let EthersLib;
const bignumber_js_1 = require("bignumber.js");
const contracts_1 = require("./contracts");
const erc20_1 = require("./contracts/erc20");
const Utils = __importStar(require("./utils"));
const eventBus_1 = require("./eventBus");
const constants_1 = require("./constants");
const providers_json_1 = __importDefault(require("./providers.json"));
let Web3Modal;
const RequireJS = {
    require(reqs, callback) {
        window.require(reqs, callback);
    }
};
let currentModuleDir;
if (typeof window !== "undefined" && window["application"]) {
    currentModuleDir = window["application"].currentModuleDir;
}
;
function requireAsync(modules) {
    return new Promise((resolve, reject) => {
        RequireJS.require(modules, (result) => {
            resolve(result);
        });
    });
}
async function initEthersLib() {
    if (typeof window !== "undefined") {
        const ethers = await requireAsync(['ethers']);
        window["ethers"] = ethers;
        EthersLib = ethers;
        return ethers;
    }
    else {
        EthersLib = require("ethers");
        return EthersLib;
    }
}
function initWeb3ModalLib(callback) {
    if (typeof window !== "undefined") {
        RequireJS.require(['@ijstech/eth-wallet-web3modal'], (web3modal) => {
            window["@ijstech/eth-wallet-web3modal"] = web3modal;
            callback();
        });
    }
    ;
}
;
function toString(value) {
    if (Array.isArray(value)) {
        let result = [];
        for (let i = 0; i < value.length; i++) {
            result.push(toString(value[i]));
        }
        return result;
    }
    else if (typeof value === "number")
        return value.toString(10);
    else if (bignumber_js_1.BigNumber.isBigNumber(value))
        return value.toFixed();
    else
        return value;
}
exports.toString = toString;
;
;
;
;
;
class EthereumProvider {
    constructor(wallet, events, options) {
        this._isConnected = false;
        this.wallet = wallet;
        this._events = events;
        this._options = options;
        if (this._options) {
            if (this._options.name) {
                this._name = this._options.name;
            }
            if (this._options.image) {
                this._image = this._options.image;
            }
        }
    }
    get name() {
        return this._name;
    }
    get displayName() {
        return 'Ethereum';
    }
    get provider() {
        return window['ethereum'];
    }
    get image() {
        return this._image;
    }
    installed() {
        return !!window['ethereum'];
    }
    get events() {
        return this._events;
    }
    get options() {
        return this._options;
    }
    get selectedAddress() {
        return this._selectedAddress;
    }
    toChecksumAddress(address) {
        address = address.toLowerCase().replace('0x', '');
        let sha3 = window['sha3'];
        let hash = sha3.keccak256(address);
        let ret = '0x';
        for (let i = 0; i < address.length; i++) {
            if (parseInt(hash[i], 16) >= 8) {
                ret += address[i].toUpperCase();
            }
            else {
                ret += address[i];
            }
        }
        return ret;
    }
    removeListeners() {
        if (this.handleAccountsChanged) {
            this.provider.removeListener('accountsChanged', this.handleAccountsChanged);
        }
        if (this.handleChainChanged) {
            this.provider.removeListener('chainChanged', this.handleChainChanged);
        }
        if (this.handleConnect) {
            this.provider.removeListener('connect', this.handleConnect);
        }
        if (this.handleDisconnect) {
            this.provider.removeListener('disconnect', this.handleDisconnect);
        }
    }
    _handleAccountsChanged(accounts, eventPayload) {
        let accountAddress;
        let hasAccounts = accounts && accounts.length > 0;
        if (hasAccounts) {
            this._selectedAddress = this.toChecksumAddress(accounts[0]);
            accountAddress = this._selectedAddress;
            this.wallet.account = {
                address: accountAddress
            };
        }
        this._isConnected = hasAccounts;
        eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.AccountsChanged, Object.assign(Object.assign({}, eventPayload), { account: accountAddress }));
        if (this.onAccountChanged)
            this.onAccountChanged(accountAddress);
    }
    initEvents() {
        let self = this;
        if (this.installed()) {
            this.removeListeners();
            this.handleAccountsChanged = (accounts) => {
                self._handleAccountsChanged(accounts);
            };
            this.handleChainChanged = (chainId) => {
                self.wallet.chainId = parseInt(chainId);
                if (this._options && this._options.useDefaultProvider) {
                    if (this._options.infuraId)
                        this.wallet.infuraId = this._options.infuraId;
                    self.wallet.setDefaultProvider();
                }
                eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.ChainChanged, chainId);
                if (self.onChainChanged)
                    self.onChainChanged(chainId);
            };
            this.handleConnect = (connectInfo) => {
                eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.Connect, connectInfo);
                if (self.onConnect)
                    self.onConnect(connectInfo);
            };
            this.handleDisconnect = (error) => {
                this._isConnected = false;
                eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.Disconnect, error);
                if (self.onDisconnect)
                    self.onDisconnect(error);
            };
            this.provider.on('accountsChanged', this.handleAccountsChanged);
            this.provider.on('chainChanged', this.handleChainChanged);
            this.provider.on('connect', this.handleConnect);
            this.provider.on('disconnect', this.handleDisconnect);
        }
        ;
    }
    async connect(eventPayload) {
        this.wallet.chainId = parseInt(this.provider.chainId, 16);
        this.wallet.provider = this.provider;
        if (this._events) {
            this.onAccountChanged = this._events.onAccountChanged;
            this.onChainChanged = this._events.onChainChanged;
            this.onConnect = this._events.onConnect;
            this.onDisconnect = this._events.onDisconnect;
        }
        this.initEvents();
        let self = this;
        try {
            if (this.installed()) {
                if (eventPayload === null || eventPayload === void 0 ? void 0 : eventPayload.userTriggeredConnect) {
                    await this.provider.request({ method: 'eth_requestAccounts' }).then((accounts) => {
                        self._handleAccountsChanged(accounts, eventPayload);
                    });
                }
                else {
                    if (this.provider.selectedAddress) {
                        self._handleAccountsChanged([this.provider.selectedAddress], eventPayload);
                    }
                }
            }
        }
        catch (error) {
            console.error(error);
        }
        return this.provider;
    }
    async disconnect() {
        if (this.provider == null) {
            return;
        }
        if (this.provider.disconnect) {
            try {
                await this.provider.disconnect();
            }
            catch (error) {
                console.error(error);
            }
        }
        this.wallet.account = null;
        this._isConnected = false;
        await this.provider.request({
            method: "wallet_revokePermissions",
            params: [
                {
                    eth_accounts: {},
                },
            ],
        });
    }
    isConnected() {
        return this._isConnected;
    }
    addToken(option, type) {
        return new Promise(async function (resolve, reject) {
            try {
                let result = await this.provider.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: type || 'ERC20',
                        options: option,
                    },
                });
                resolve(result);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    switchNetwork(chainId) {
        let self = this;
        return new Promise(async function (resolve, reject) {
            try {
                let chainIdHex = '0x' + chainId.toString(16);
                try {
                    let result = await self.provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{
                                chainId: chainIdHex
                            }]
                    });
                    resolve(!result);
                }
                catch (error) {
                    if (error.code === 4902) {
                        try {
                            let network = self.wallet.networksMap[chainId];
                            if (!network)
                                resolve(false);
                            let { chainName, nativeCurrency, rpcUrls, blockExplorerUrls, iconUrls } = network;
                            if (!Array.isArray(rpcUrls))
                                rpcUrls = [rpcUrls];
                            if (blockExplorerUrls && !Array.isArray(blockExplorerUrls))
                                blockExplorerUrls = [blockExplorerUrls];
                            if (iconUrls && !Array.isArray(iconUrls))
                                iconUrls = [iconUrls];
                            let result = await self.provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                        chainId: chainIdHex,
                                        chainName: chainName,
                                        nativeCurrency: nativeCurrency,
                                        rpcUrls: rpcUrls,
                                        blockExplorerUrls: blockExplorerUrls,
                                        iconUrls: iconUrls
                                    }]
                            });
                            resolve(!result);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                    else
                        reject(error);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }
    encrypt(key) {
        throw new Error("Method not implemented.");
    }
    decrypt(data) {
        throw new Error("Method not implemented.");
    }
}
exports.EthereumProvider = EthereumProvider;
class MetaMaskProvider extends EthereumProvider {
    get displayName() {
        return providers_json_1.default.MetaMask.displayName;
    }
    get image() {
        return providers_json_1.default.MetaMask.image;
    }
    get homepage() {
        return providers_json_1.default.MetaMask.homepage;
    }
    installed() {
        let ethereum = window['ethereum'];
        return !!ethereum && !!ethereum.isMetaMask;
    }
    async encrypt(key) {
        let response = await new Promise((resolve, reject) => {
            this.provider.send({
                jsonrpc: '2.0',
                id: new Date().getTime(),
                method: 'eth_getEncryptionPublicKey',
                params: [this.wallet.address]
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (typeof result === 'string')
                    result = JSON.parse(result);
                if (result.error)
                    return reject(result.error);
                resolve(result);
            });
        });
        let publicKey = new Uint8Array(window.atob(response.result)
            .split('').map(e => e.codePointAt(0)));
        const encoder = new TextEncoder();
        const msg = encoder.encode(key);
        let nacl = window['nacl'];
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const ephemeralKeyPair = nacl.box.keyPair();
        const encKey = nacl.box(msg, nonce, publicKey, ephemeralKeyPair.secretKey);
        return Utils.uint8ArrayToHex(nonce) +
            Utils.uint8ArrayToHex(ephemeralKeyPair.publicKey) +
            Utils.uint8ArrayToHex(encKey);
    }
    async decrypt(data) {
        let encMsg = Utils.stringToUnicodeHex(JSON.stringify({
            version: 'x25519-xsalsa20-poly1305',
            nonce: window.btoa(Utils.hexToString(data.substring(0, 48))),
            ephemPublicKey: window.btoa(Utils.hexToString(data.substring(48, 112))),
            ciphertext: window.btoa(Utils.hexToString(data.substring(112)))
        }));
        let msg = await new Promise((resolve, reject) => {
            this.provider.send({
                jsonrpc: '2.0',
                id: new Date().getTime(),
                method: 'eth_decrypt',
                params: [encMsg, this.wallet.address]
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (typeof result === 'string')
                    result = JSON.parse(result);
                if (result.error)
                    return reject(result.error);
                resolve(result);
            });
        });
        return msg.result;
    }
}
exports.MetaMaskProvider = MetaMaskProvider;
class Web3ModalProvider extends EthereumProvider {
    constructor(wallet, events, options) {
        super(wallet, events, options);
    }
    get name() {
        return 'walletconnect';
    }
    get displayName() {
        return providers_json_1.default.Web3Modal.displayName;
    }
    get provider() {
        return this._provider;
    }
    get image() {
        return providers_json_1.default.Web3Modal.image;
    }
    get homepage() {
        return null;
    }
    installed() {
        return true;
    }
    get options() {
        return this._options;
    }
    initializeWeb3Modal(options) {
        let func = () => {
            Web3Modal = window["@ijstech/eth-wallet-web3modal"].EthereumProvider;
        };
        initWeb3ModalLib(func);
    }
    async connect(eventPayload) {
        if (!this._provider) {
            this.initializeWeb3Modal(this._options);
        }
        await this.disconnect();
        this._provider = await Web3Modal.init(Object.assign({ showQrModal: true, qrModalOptions: { themeMode: "light" }, methods: ["eth_sendTransaction", "personal_sign"], events: ["chainChanged", "accountsChanged"] }, this._options));
        await this._provider.enable();
        this.wallet.chainId = this.provider.chainId;
        this.wallet.provider = this.provider;
        await this.wallet.init();
        if (this._events) {
            this.onAccountChanged = this._events.onAccountChanged;
            this.onChainChanged = this._events.onChainChanged;
            this.onConnect = this._events.onConnect;
            this.onDisconnect = this._events.onDisconnect;
        }
        this.initEvents();
        let self = this;
        try {
            let hasAccounts = this._provider.accounts && this._provider.accounts.length > 0;
            this._isConnected = hasAccounts;
            if (hasAccounts) {
                let accountAddress = this._provider.accounts[0];
                this._selectedAddress = self.toChecksumAddress(accountAddress);
                this.wallet.account = {
                    address: accountAddress
                };
                eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.AccountsChanged, Object.assign(Object.assign({}, eventPayload), { account: accountAddress }));
                if (self.onAccountChanged)
                    self.onAccountChanged(accountAddress);
            }
        }
        catch (error) {
            console.error(error);
        }
        return this.provider;
    }
    async disconnect() {
        if (this.provider == null) {
            return;
        }
        if (this.provider.disconnect) {
            try {
                await this.provider.disconnect();
            }
            catch (error) {
                console.error(error);
                Object.keys(localStorage)
                    .filter(key => key.startsWith("wc@2:"))
                    .forEach(key => localStorage.removeItem(key));
            }
        }
        this.wallet.account = null;
        this._isConnected = false;
    }
}
exports.Web3ModalProvider = Web3ModalProvider;
;
class Wallet {
    constructor(provider, account) {
        this._eventTopicAbi = {};
        this._eventHandler = {};
        this._sendTxEventHandler = {};
        this._contracts = {};
        this._networksMap = {};
        this._multicallInfoMap = {};
        this._walletEventIds = new Set();
        this._abiHashDict = {};
        this._abiContractDict = {};
        this._abiAddressDict = {};
        this._abiEventDict = {};
        this._provider = provider;
        if (Array.isArray(account)) {
            this._accounts = account;
            this._account = account[0];
        }
        else {
            this._account = account;
        }
        ;
        if (typeof window === "undefined") {
            EthersLib = require("ethers");
        }
        if (EthersLib) {
            this.init();
        }
        this._utils = {
            fromDecimals: Utils.fromDecimals,
            fromWei: this.fromWei,
            hexToUtf8: this.hexToUtf8,
            sha3: this.sha3,
            toDecimals: Utils.toDecimals,
            toString: Utils.toString,
            toUtf8: this.toUtf8,
            toWei: this.toWei,
            stringToBytes: Utils.stringToBytes,
            stringToBytes32: Utils.stringToBytes32
        };
    }
    ;
    static getInstance() {
        return Wallet.instance;
    }
    static getClientInstance() {
        return Wallet.instance;
    }
    static getRpcWalletInstance(instanceId) {
        return Wallet._rpcWalletPoolMap[instanceId];
    }
    fromWei(value, unit) {
        const ethers = EthersLib.ethers;
        const bigValue = bignumber_js_1.BigNumber.isBigNumber(value) ? value : new bignumber_js_1.BigNumber(value);
        const convertedValue = ethers.formatUnits(bigValue.toFixed(), unit);
        const formattedValue = convertedValue.endsWith(".0")
            ? convertedValue.slice(0, -2)
            : convertedValue;
        return formattedValue;
    }
    toWei(value, unit) {
        const ethers = EthersLib.ethers;
        const result = ethers.parseUnits(value, unit);
        return result.toString();
    }
    hexToUtf8(value) {
        const ethers = EthersLib.ethers;
        return ethers.toUtf8String(value);
    }
    toUtf8(value) {
        const ethers = EthersLib.ethers;
        return ethers.toUtf8String(value);
    }
    async init() {
        if (!EthersLib) {
            if (typeof window !== "undefined") {
                await window['application'].loadScript(currentModuleDir + '/ethers.js');
            }
            EthersLib = await initEthersLib();
            if (this._account && this._account.privateKey && !this._account.address) {
                this._account.address = this.privateKeyToAccount(this._account.privateKey).address;
            }
        }
        if (this._provider) {
            const ethers = EthersLib.ethers;
            if (typeof this._provider === 'string') {
                this._ethersProvider = new ethers.JsonRpcProvider(this._provider);
            }
            else {
                this._ethersProvider = new ethers.BrowserProvider(this._provider);
            }
        }
    }
    ;
    privateKeyToAccount(privateKey) {
        const ethersWallet = new EthersLib.Wallet(privateKey);
        return {
            address: ethersWallet.address,
            privateKey: ethersWallet.privateKey
        };
    }
    get isConnected() {
        return this.clientSideProvider ? this.clientSideProvider.isConnected() : false;
    }
    async switchNetwork(chainId) {
        let result;
        if (this.clientSideProvider) {
            result = await this.clientSideProvider.switchNetwork(chainId);
        }
        else {
            this.chainId = chainId;
            this.setDefaultProvider();
        }
        return result;
    }
    initClientWallet(config) {
        const wallet = Wallet.instance;
        wallet.chainId = config.defaultChainId;
        wallet._infuraId = config.infuraId;
        wallet._networksMap = {};
        wallet.setMultipleNetworksInfo(config.networks);
        wallet.setDefaultProvider();
        wallet._multicallInfoMap = {};
        if (config.multicalls) {
            for (let multicall of config.multicalls) {
                wallet._multicallInfoMap[multicall.chainId] = multicall;
            }
        }
    }
    registerWalletEvent(sender, event, callback) {
        const registry = eventBus_1.EventBus.getInstance().register(sender, event, callback);
        this._walletEventIds.add(registry.id);
        return registry;
    }
    ;
    unregisterWalletEvent(registry) {
        registry.unregister();
        this._walletEventIds.delete(registry.id);
    }
    unregisterAllWalletEvents() {
        const eventBus = eventBus_1.EventBus.getInstance();
        this._walletEventIds.forEach(id => {
            eventBus.unregister(id);
        });
        this._walletEventIds.clear();
    }
    destoryRpcWalletInstance(instanceId) {
        delete Wallet._rpcWalletPoolMap[instanceId];
    }
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    initRpcWallet(config) {
        const wallet = new RpcWallet();
        const defaultNetwork = config.defaultChainId ? config.networks.find(v => v.chainId === config.defaultChainId) : config.networks[0];
        wallet.chainId = defaultNetwork.chainId;
        const rpc = defaultNetwork.rpcUrls[0];
        wallet.setProvider(rpc);
        wallet._infuraId = config.infuraId;
        wallet._networksMap = {};
        wallet.setMultipleNetworksInfo(config.networks);
        wallet._multicallInfoMap = {};
        if (config.multicalls) {
            for (let multicall of config.multicalls) {
                wallet._multicallInfoMap[multicall.chainId] = multicall;
            }
        }
        let instanceId = this.generateUUID();
        while (Wallet._rpcWalletPoolMap[instanceId]) {
            instanceId = this.generateUUID();
        }
        wallet.instanceId = instanceId;
        Wallet._rpcWalletPoolMap[instanceId] = wallet;
        wallet.initWalletEvents();
        return instanceId;
    }
    setDefaultProvider() {
        var _a;
        if (this._networksMap[this.chainId] && this._networksMap[this.chainId].rpcUrls.length > 0) {
            let rpc = this._networksMap[this.chainId].rpcUrls[0];
            if (!rpc || (rpc.indexOf('{INFURA_ID}') && !this._infuraId)) {
            }
            else {
                if (rpc.indexOf('{INFURA_ID}')) {
                    rpc = rpc.replace('{INFURA_ID}', (_a = this._infuraId) !== null && _a !== void 0 ? _a : '');
                }
                this.provider = rpc;
            }
        }
    }
    async connect(clientSideProvider, eventPayload) {
        this.clientSideProvider = clientSideProvider;
        await this.clientSideProvider.connect(eventPayload);
        const providerOptions = this.clientSideProvider.options;
        if (providerOptions && providerOptions.useDefaultProvider) {
            if (providerOptions.infuraId)
                this._infuraId = providerOptions.infuraId;
            this.setDefaultProvider();
        }
        else {
            this.provider = this.clientSideProvider.provider;
        }
    }
    async disconnect() {
        if (this.clientSideProvider) {
            await this.clientSideProvider.disconnect();
            this.clientSideProvider = null;
            eventBus_1.EventBus.getInstance().dispatch(constants_1.ClientWalletEvent.AccountsChanged, {
                account: null
            });
        }
        this.setDefaultProvider();
    }
    async encrypt(key) {
        if (this.clientSideProvider) {
            return this.clientSideProvider.encrypt(key);
        }
    }
    async decrypt(data) {
        if (this.clientSideProvider) {
            return this.clientSideProvider.decrypt(data);
        }
    }
    get accounts() {
        return new Promise(async (resolve) => {
            await this.init();
            if (this._accounts) {
                let result = [];
                for (let i = 0; i < this._accounts.length; i++) {
                    if (!this._accounts[i].address && this._accounts[i].privateKey) {
                        this._accounts[i].address = this.privateKeyToAccount(this._accounts[i].privateKey).address;
                    }
                    result.push(this._accounts[i].address);
                }
                return resolve(result);
            }
            else if (this._account)
                return resolve([this._account.address]);
            if (this._ethersProvider) {
                const hardhatAccounts = await this._ethersProvider.listAccounts();
                const addresses = hardhatAccounts.map((account) => account.address);
                resolve(addresses);
            }
        });
    }
    get address() {
        if (this.clientSideProvider) {
            return this.clientSideProvider.selectedAddress;
        }
        else if (EthersLib) {
            if (this._account && this._account.privateKey) {
                if (!this._account.address) {
                    this._account.address = this.privateKeyToAccount(this._account.privateKey).address;
                }
                return this._account.address;
            }
            else if (this._defaultAccount) {
                return this._defaultAccount;
            }
            if (!this._account) {
                this._account = this.createAccount();
                return this._account.address;
            }
            else
                return this._account.address;
        }
        return '';
    }
    get account() {
        return {
            address: this.address
        };
    }
    set account(value) {
        this._defaultAccount = '';
        this._account = value;
    }
    get infuraId() {
        return this._infuraId;
    }
    set infuraId(value) {
        this._infuraId = value;
        this.setDefaultProvider();
    }
    get networksMap() {
        return this._networksMap;
    }
    get multicallInfoMap() {
        return this._multicallInfoMap;
    }
    set multicallInfoMap(value) {
        this._multicallInfoMap = value;
    }
    getNetworkInfo(chainId) {
        return this._networksMap[chainId];
    }
    setNetworkInfo(network) {
        this._networksMap[network.chainId] = network;
    }
    setMultipleNetworksInfo(networks) {
        for (let network of networks) {
            this.setNetworkInfo(network);
        }
    }
    createAccount() {
        if (EthersLib) {
            let acc = EthersLib.Wallet.createRandom();
            this._accounts = this._accounts || [];
            this._accounts.push({
                address: acc.address,
                privateKey: acc.privateKey
            });
            return {
                address: acc.address,
                privateKey: acc.privateKey
            };
        }
    }
    decodeLog(inputs, hexString, topics) {
        try {
            const eventName = "MyDecodedEvent";
            const eventInputsAbi = inputs.map(input => ({
                name: input.name || '',
                type: input.type,
                indexed: !!input.indexed,
            }));
            const ethers = EthersLib.ethers;
            const iface = new ethers.Interface([{
                    type: "event",
                    name: eventName,
                    inputs: eventInputsAbi,
                    anonymous: true,
                }]);
            const eventFragment = iface.getEvent(eventName);
            if (!eventFragment) {
                throw new Error("Could not create event fragment from inputs.");
            }
            const decoded = iface.decodeEventLog(eventFragment, hexString, topics);
            const result = {};
            let i = 0;
            eventFragment.inputs.forEach((input, index) => {
                const value = decoded[index];
                result[i] = value;
                if (input.name) {
                    if (typeof value === 'bigint') {
                        result[input.name] = value.toString();
                    }
                    else {
                        result[input.name] = value;
                    }
                }
                i++;
            });
            result.__length__ = i;
            return result;
        }
        catch (error) {
            console.error("Error decoding log with ethers.js:", error);
            throw error;
        }
    }
    get defaultAccount() {
        if (this._account)
            return this._account.address;
        else {
            return this._defaultAccount;
        }
    }
    set defaultAccount(address) {
        this._defaultAccount = address;
        if (this._accounts) {
            for (let i = 0; i < this._accounts.length; i++) {
                if (!this._accounts[i].address && this._accounts[i].privateKey && EthersLib) {
                    this._accounts[i].address = this.privateKeyToAccount(this._accounts[i].privateKey).address;
                }
                if (this._accounts[i].address && this._accounts[i].address.toLowerCase() == address.toLowerCase()) {
                    this._account = this._accounts[i];
                    if (EthersLib) {
                        const ethers = EthersLib.ethers;
                        this._ethersSigner = new ethers.Wallet(this._account.privateKey, this._ethersProvider);
                    }
                    return;
                }
            }
        }
        else if (this._account && this._account.address && this._account.address.toLowerCase() == address.toLowerCase()) {
            return;
        }
    }
    async getChainId() {
        await this.init();
        if (!this.chainId) {
            const network = await this._ethersProvider.getNetwork();
            this.chainId = Number(network.chainId);
        }
        return this.chainId;
    }
    get provider() {
        return this._provider;
    }
    set provider(value) {
        if (EthersLib) {
            const ethers = EthersLib.ethers;
            if (typeof value === 'string') {
                this._ethersProvider = new ethers.JsonRpcProvider(value);
            }
            else {
                this._ethersProvider = new ethers.BrowserProvider(value);
            }
        }
        this._provider = value;
    }
    async sendSignedTransaction(tx) {
        await this.init();
        try {
            const txResponse = await this._ethersProvider.broadcastTransaction(tx);
            const ethersReceipt = await txResponse.wait();
            const receipt = this.convertEthersTransactionReceipt(ethersReceipt);
            return receipt;
        }
        catch (error) {
            console.error("Error sending signed transaction:", error);
            throw error;
        }
    }
    async signTransaction(tx, privateKey) {
        await this.init();
        const ethers = EthersLib.ethers;
        const gas = tx.gas || await this._ethersProvider.estimateGas({
            from: this.address,
            to: tx.to,
            data: tx.data,
        });
        const gasLimit = tx.gasLimit || gas;
        const nonce = tx.nonce || await this.transactionCount();
        const transaction = {
            nonce,
            gasLimit,
            gasPrice: tx.gasPrice || (await this._ethersProvider.getFeeData()).gasPrice,
            to: tx.to,
            value: tx.value || 0,
            data: tx.data,
        };
        if (privateKey || (this._account && this._account.privateKey)) {
            const wallet = new ethers.Wallet(privateKey || this._account.privateKey, this._ethersProvider);
            const signedTx = await wallet.signTransaction(transaction);
            return signedTx;
        }
        const signer = await this.getSigner();
        const signedTx = await signer.signTransaction(transaction);
        return signedTx;
    }
    registerSendTxEvents(eventsOptions) {
        this._sendTxEventHandler = eventsOptions;
    }
    ;
    async _call(abiHash, address, methodName, params, options) {
        if (!address || !methodName)
            throw new Error("no contract address or method name");
        const ethers = EthersLib.ethers;
        const contract = new ethers.Contract(address, this._abiHashDict[abiHash], this._ethersProvider);
        let result;
        if (params) {
            result = await contract[methodName].staticCall(...params);
        }
        else {
            result = await contract[methodName].staticCall();
        }
        return result;
    }
    async _createTxData(signer, abiHash, address, methodName, params) {
        const abi = this._abiHashDict[abiHash];
        const ethers = EthersLib.ethers;
        const contract = new ethers.Contract(address, abi, signer);
        const txParams = [];
        for (let item of params) {
            if (item instanceof bignumber_js_1.BigNumber) {
                txParams.push(item.toFixed());
            }
            else {
                txParams.push(item);
            }
        }
        const txData = await contract[methodName].populateTransaction(...txParams);
        return txData;
    }
    async _createTxObj(address, txData, options) {
        const ethers = EthersLib.ethers;
        const tx = {
            to: address,
            from: this.address,
        };
        if (txData) {
            tx.data = txData.data;
        }
        if (options) {
            if (typeof options === "number" || bignumber_js_1.BigNumber.isBigNumber(options)) {
                tx.value = typeof options === "number" ? new bignumber_js_1.BigNumber(options) : options;
            }
            else if (options && typeof options === "object" && "gas" in options || "gasLimit" in options || "value" in options) {
                if (options.value)
                    tx.value = new bignumber_js_1.BigNumber(options.value);
                if (options.gas || options.gasLimit)
                    tx.gas = new bignumber_js_1.BigNumber(options.gas || options.gasLimit);
                if (options.gasPrice)
                    tx.gasPrice = new bignumber_js_1.BigNumber(options.gasPrice);
                if (options.nonce)
                    tx.nonce = options.nonce;
            }
        }
        if (!tx.gas) {
            tx.gas = Number(await this._ethersProvider.estimateGas(Object.assign(Object.assign({}, tx), { value: tx.value instanceof bignumber_js_1.BigNumber ? tx.value.toFixed() : tx.value })));
            tx.gas = Math.min(await this.blockGasLimit(), Math.round(tx.gas * 1.5));
        }
        if (!tx.gasPrice) {
            tx.gasPrice = new bignumber_js_1.BigNumber((await this._ethersProvider.getFeeData()).gasPrice);
        }
        if (!tx.nonce) {
            tx.nonce = await this.transactionCount();
        }
        return tx;
    }
    async _txObj(abiHash, address, methodName, params, options) {
        let signer = await this.getSigner();
        const txData = await this._createTxData(signer, abiHash, address, methodName, params);
        const txObj = await this._createTxObj(address, txData, options);
        return txObj;
    }
    async getSigner() {
        let signer;
        const isClientSide = typeof window !== "undefined" && !!this.clientSideProvider;
        if (isClientSide) {
            const ethers = EthersLib.ethers;
            if (typeof this.clientSideProvider.provider === 'string') {
                this._ethersProvider = new ethers.JsonRpcProvider(this.clientSideProvider.provider);
            }
            else {
                this._ethersProvider = new ethers.BrowserProvider(this.clientSideProvider.provider);
            }
            if (this._account && this._account.privateKey) {
                signer = new ethers.Wallet(this._account.privateKey, this._ethersProvider);
            }
            else {
                signer = await this._ethersProvider.getSigner(this.address);
            }
        }
        else if (this._accounts && this._accounts.some(v => v.address == this.address)) {
            const account = this._accounts.find(v => v.address == this.address);
            const ethers = EthersLib.ethers;
            signer = new ethers.Wallet(account.privateKey, this._ethersProvider);
        }
        else if (this._account && this._account.privateKey) {
            const ethers = EthersLib.ethers;
            signer = new ethers.Wallet(this._account.privateKey, this._ethersProvider);
        }
        else {
            signer = await this._ethersProvider.getSigner(this.address);
        }
        return signer;
    }
    extractEthersErrorInfo(errorString) {
        try {
            const actionMatch = errorString.match(/action="([^"]+)"/);
            const reasonMatch = errorString.match(/reason="([^"]+)"/);
            const errorCodeMatch = errorString.match(/"code":\s*(\d+)/);
            const messageMatch = errorString.match(/"message":\s*"([^"]+)"/);
            if (!actionMatch && !reasonMatch && !errorCodeMatch && !messageMatch) {
                throw new Error("Failed to extract required fields from error string");
            }
            const action = actionMatch && actionMatch[1];
            const reason = reasonMatch && reasonMatch[1];
            const errorCode = errorCodeMatch && parseInt(errorCodeMatch[1], 10);
            const message = messageMatch && messageMatch[1];
            return {
                action,
                reason,
                errorCode,
                message,
            };
        }
        catch (error) {
            console.error("Error parsing Ethers.js error string:", error);
            return null;
        }
    }
    async _send(abiHash, address, methodName, params, options) {
        let receipt;
        try {
            if (!methodName) {
                const bytecode = params.shift();
                const abi = this._abiHashDict[abiHash];
                const ethers = EthersLib.ethers;
                let signer = await this.getSigner();
                const factory = new ethers.ContractFactory(abi, bytecode, signer);
                const contract = await factory.deploy(...params);
                const ethersReceipt = await contract.deploymentTransaction().wait();
                receipt = this.convertEthersTransactionReceipt(ethersReceipt);
            }
            else {
                let tx = await this._txObj(abiHash, address, methodName, params, options);
                receipt = await this.sendTransaction(tx);
            }
        }
        catch (e) {
            console.error("Error sending transaction:", methodName);
            const errorInfo = this.extractEthersErrorInfo(e.message);
            let error = e;
            if (errorInfo) {
                error = new Error(errorInfo.message);
            }
            if (this._sendTxEventHandler.transactionHash)
                this._sendTxEventHandler.transactionHash(error);
        }
        return receipt;
    }
    async _txData(abiHash, address, methodName, params, options) {
        await this.init();
        const abi = this._abiHashDict[abiHash];
        if (!abi) {
            throw new Error(`ABI not found for hash: ${abiHash}`);
        }
        const ethers = EthersLib.ethers;
        const iface = new ethers.Interface(abi);
        const data = iface.encodeFunctionData(methodName, params || []);
        return data;
    }
    async methods(...args) {
    }
    ;
    get balance() {
        return this.balanceOf(this.address);
    }
    ;
    balanceOf(address) {
        let self = this;
        return new Promise(async function (resolve) {
            var _a, _b;
            try {
                let network = self._networksMap[self.chainId];
                let decimals = 18;
                if (network) {
                    if (network.nativeCurrency && network.nativeCurrency.decimals) {
                        decimals = network.nativeCurrency.decimals;
                    }
                    let url = network.rpcUrls[0];
                    if (typeof window !== "undefined" && ((_a = self.clientSideProvider) === null || _a === void 0 ? void 0 : _a.provider)) {
                        const balance = await self.clientSideProvider.provider.request({
                            method: 'eth_getBalance',
                            params: [address, 'latest'],
                        });
                        resolve(new bignumber_js_1.BigNumber(balance).div(10 ** decimals));
                    }
                    else if (!url || (url.indexOf('{INFURA_ID}') > 0 && !self._infuraId)) {
                        throw new Error("No provider available");
                    }
                    else {
                        if (url.indexOf('{INFURA_ID}')) {
                            url = url.replace('{INFURA_ID}', (_b = self._infuraId) !== null && _b !== void 0 ? _b : '');
                        }
                        const data = {
                            id: 1,
                            jsonrpc: '2.0',
                            method: 'eth_getBalance',
                            params: [address, 'latest'],
                        };
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data),
                        });
                        const json = await response.json();
                        if (json.error) {
                            resolve(new bignumber_js_1.BigNumber(0));
                        }
                        resolve(new bignumber_js_1.BigNumber(json.result).div(10 ** decimals));
                    }
                }
                else {
                    await self.init();
                    const ethers = EthersLib.ethers;
                    const ethersProvider = new ethers.BrowserProvider(self._provider);
                    const balance = await ethersProvider.getBalance(address);
                    const balanceInEther = ethers.formatEther(balance);
                    resolve(new bignumber_js_1.BigNumber(balanceInEther));
                }
            }
            catch (err) {
                console.log('err', err);
                resolve(new bignumber_js_1.BigNumber(0));
            }
        });
    }
    ;
    async recoverSigner(msg, signature) {
        await this.init();
        const ethers = EthersLib.ethers;
        try {
            const signingAddress = ethers.verifyMessage(msg, signature);
            return signingAddress;
        }
        catch (error) {
            console.error("Error recovering signer:", error);
            throw error;
        }
    }
    async getBlock(blockHashOrBlockNumber, returnTransactionObjects) {
        await this.init();
        try {
            const block = await this._ethersProvider.getBlock(blockHashOrBlockNumber || "latest", returnTransactionObjects);
            return {
                number: BigInt(block.number),
                hash: block.hash,
                parentHash: block.parentHash,
                nonce: block.nonce,
                sha3Uncles: null,
                logsBloom: null,
                transactionRoot: null,
                stateRoot: block.stateRoot,
                receiptsRoot: block.receiptsRoot,
                miner: block.miner,
                extraData: block.extraData,
                gasLimit: BigInt(block.gasLimit.toString()),
                gasUsed: BigInt(block.gasUsed.toString()),
                timestamp: BigInt(block.timestamp),
                baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas.toString()) : undefined,
                size: null,
                difficulty: BigInt(block.difficulty.toString()),
                totalDifficulty: BigInt(block.difficulty.toString()),
                uncles: null,
                transactions: returnTransactionObjects ? block.prefetchedTransactions.map(tx => ({
                    hash: tx.hash,
                    nonce: BigInt(tx.nonce),
                    blockHash: tx.blockHash,
                    blockNumber: BigInt(tx.blockNumber),
                    transactionIndex: BigInt(tx.index),
                    from: tx.from,
                    to: tx.to,
                    value: new bignumber_js_1.BigNumber(tx.value.toString()),
                    gasPrice: new bignumber_js_1.BigNumber(tx.gasPrice.toString()),
                    gas: BigInt(tx.gasLimit.toString()),
                    input: tx.data,
                })) : [],
            };
        }
        catch (error) {
            console.error("Error fetching block:", error);
            throw error;
        }
    }
    async getBlockNumber() {
        await this.init();
        if (this._ethersProvider) {
            return await this._ethersProvider.getBlockNumber();
        }
        throw new Error("Ethers provider is not initialized");
    }
    async getBlockTimestamp(blockHashOrBlockNumber) {
        await this.init();
        if (this._ethersProvider) {
            const block = await this._ethersProvider.getBlock(blockHashOrBlockNumber || 'latest');
            return block.timestamp;
        }
        throw new Error("Ethers provider is not initialized");
    }
    ;
    set privateKey(value) {
        this._account = {
            address: '',
            privateKey: value
        };
    }
    ;
    sha3(value) {
        const ethers = EthersLib.ethers;
        const hashedData = ethers.keccak256(ethers.toUtf8Bytes(value));
        return hashedData;
    }
    async registerEvent(abi, eventMap, address, handler) {
        await this.init();
        let hash = '';
        if (typeof (abi) == 'string') {
            hash = this.sha3(abi);
            abi = JSON.parse(abi);
        }
        else {
            hash = this.sha3(JSON.stringify(abi));
        }
        this.registerAbiContracts(hash, address, handler);
        this._eventTopicAbi[hash] = {};
        for (let topic in eventMap) {
            this._eventTopicAbi[hash][topic] = eventMap[topic];
        }
    }
    ;
    getAbiEvents(abi) {
        if (EthersLib) {
            let events = abi.filter(e => e.type == "event");
            let eventMap = {};
            for (let i = 0; i < events.length; i++) {
                let topic = this.sha3(events[i].name + "(" + events[i].inputs.map(e => e.type == "tuple" ? "(" + (e.components.map(f => f.type)) + ")" : e.type).join(",") + ")");
                eventMap[topic] = events[i];
            }
            return eventMap;
        }
        ;
    }
    ;
    getAbiTopics(abi, eventNames) {
        if (EthersLib) {
            if (!eventNames || eventNames.length == 0)
                eventNames = null;
            let result = [];
            let events = abi.filter(e => e.type == "event");
            for (let i = 0; i < events.length; i++) {
                if (!eventNames || eventNames.indexOf(events[i].name) >= 0) {
                    let topic = this.soliditySha3(events[i].name + "(" + events[i].inputs.map(e => e.type == "tuple" ? "(" + (e.components.map(f => f.type)) + ")" : e.type).join(",") + ")");
                    result.push(topic);
                }
            }
            if (result.length == 0 && eventNames && eventNames.length > 0)
                return ['NULL'];
            return [result];
        }
        ;
    }
    ;
    getContractAbi(address) {
        return this._abiAddressDict[address];
    }
    ;
    getContractAbiEvents(address) {
        let events = this._abiEventDict[address];
        if (events)
            return events;
        let abi = this._abiHashDict[this._abiAddressDict[address]];
        if (abi) {
            events = this.getAbiEvents(abi);
            this._abiEventDict[address] = events;
            return events;
        }
    }
    ;
    registerAbi(abi, address, handler) {
        if (EthersLib) {
            let hash = '';
            if (typeof (abi) == 'string') {
                hash = this.sha3(abi);
                abi = JSON.parse(abi);
            }
            else {
                hash = this.sha3(JSON.stringify(abi));
            }
            if (!address && !handler && this._abiHashDict[hash])
                return hash;
            let eventMap;
            eventMap = this.getAbiEvents(abi);
            this._eventTopicAbi[hash] = {};
            for (let topic in eventMap) {
                this._eventTopicAbi[hash][topic] = eventMap[topic];
            }
            this._abiHashDict[hash] = abi;
            if (address)
                this.registerAbiContracts(hash, address, handler);
            return hash;
        }
        ;
    }
    ;
    registerAbiContracts(abiHash, address, handler) {
        if (address) {
            if (!Array.isArray(address))
                address = [address];
            for (let i = 0; i < address.length; i++) {
                this._abiAddressDict[address[i]] = abiHash;
                if (handler) {
                    if (this._eventHandler[address[i]]) {
                        this._eventHandler[address[i]].push(handler);
                    }
                    else {
                        this._eventHandler[address[i]] = [handler];
                    }
                }
            }
        }
    }
    ;
    decode(abi, event, raw) {
        if (!raw)
            raw = event;
        let d;
        try {
            if (abi) {
                d = this.decodeLog(abi.inputs, raw.data, raw.topics.slice(1));
                if (d.__length__) {
                    for (let k = 0; k < d.__length__; k++)
                        delete d[k];
                    delete d['__length__'];
                }
            }
        }
        catch (err) {
        }
        let log = {
            address: event.address,
            blockNumber: event.blockNumber,
            topics: raw.topics,
            data: d ? d : raw.data,
            rawData: d ? raw.data : undefined,
            logIndex: event.logIndex,
            name: abi ? abi.name : undefined,
            transactionHash: event.transactionHash,
            transactionIndex: event.transactionIndex
        };
        return log;
    }
    ;
    async decodeEventData(data, events) {
        let event;
        if (events)
            event = events[data.topics[0]];
        else {
            const abiHash = this._abiAddressDict[data.address];
            if (abiHash && this._eventTopicAbi[abiHash]) {
                event = this._eventTopicAbi[abiHash][data.topics[0]];
            }
        }
        ;
        let log = this.decode(event, data);
        let handlers = this._eventHandler[data.address];
        if (handlers) {
            for (let handler of handlers) {
                await handler(this, log);
            }
        }
        return log;
    }
    ;
    encodeParameters(types, values) {
        const ethers = EthersLib.ethers;
        return ethers.AbiCoder.defaultAbiCoder().encode(types, values);
    }
    ;
    decodeParameters(types, hexString) {
        const ethers = EthersLib.ethers;
        return ethers.AbiCoder.defaultAbiCoder().decode(types, hexString);
    }
    ;
    scanEvents(param1, param2, param3, param4, param5) {
        let fromBlock;
        let toBlock;
        let topics;
        let events;
        let address;
        if (typeof (param1) == 'number') {
            fromBlock = param1;
            toBlock = param2;
            topics = param3;
            events = param4;
            address = param5;
        }
        else {
            fromBlock = param1.fromBlock;
            toBlock = param1.toBlock;
            topics = param1.topics;
            events = param1.events;
            address = param1.address;
        }
        ;
        return new Promise(async (resolve, reject) => {
            await this.init();
            try {
                const ethersLogs = await this._ethersProvider.getLogs({
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                    address: address,
                    topics: topics ? topics : null
                });
                let logs = ethersLogs.map((log) => ({
                    address: log.address,
                    data: log.data,
                    topics: [...log.topics],
                    logIndex: log.index,
                    transactionIndex: log.transactionIndex,
                    transactionHash: log.transactionHash,
                    blockHash: log.blockHash,
                    blockNumber: log.blockNumber,
                    removed: log.removed,
                }));
                let result = [];
                for (let i = 0; i < logs.length; i++) {
                    let e = logs[i];
                    result.push(await this.decodeEventData(e, events));
                }
                resolve(result);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    ;
    async send(to, amount) {
        await this.init();
        const value = this.utils.toDecimals(amount);
        const tx = await this._createTxObj(to, null, value);
        const receipt = await this.sendTransaction(tx);
        return receipt;
    }
    ;
    async estimateGas(tx) {
        await this.init();
        let gas = (await this._ethersProvider.estimateGas(Object.assign(Object.assign({}, tx), { value: tx.value instanceof bignumber_js_1.BigNumber ? tx.value.toFixed() : tx.value }))).toString();
        return gas;
    }
    ;
    async setBlockTime(time) {
        await this.init();
        try {
            const method = time > 1000000000 ? 'evm_mine' : 'evm_increaseTime';
            const result = await this._ethersProvider.send(method, [time]);
            if (method === 'evm_increaseTime') {
                await this._ethersProvider.send('evm_mine', []);
            }
            return result;
        }
        catch (error) {
            console.error("Error setting block time:", error);
            throw error;
        }
    }
    async increaseBlockTime(value) {
        await this.init();
        try {
            const result = await this._ethersProvider.send("evm_increaseTime", [value]);
            await this._ethersProvider.send("evm_mine", []);
            return result;
        }
        catch (error) {
            console.error("Error increasing block time:", error);
            throw error;
        }
    }
    async signMessage(msg) {
        await this.init();
        const ethers = EthersLib.ethers;
        let signature;
        if (typeof window === "undefined" && !this._account) {
            const hexMessage = ethers.toUtf8Bytes(msg);
            signature = await this._ethersProvider.send("eth_sign", [this.address, ethers.hexlify(hexMessage)]);
        }
        else {
            let signer = await this.getSigner();
            if (signer) {
                signature = await signer.signMessage(msg);
            }
        }
        return signature;
    }
    ;
    async signTypedDataV4(data) {
        await this.init();
        try {
            const signer = await this.getSigner();
            console.log("signer", data.domain, data.types, data.message);
            const signature = await signer.signTypedData(data.domain, data.types, data.message);
            console.log("signature", signature);
            return signature;
        }
        catch (error) {
            console.error("Error signing typed data:", error);
            throw error;
        }
    }
    async recoverTypedSignatureV4(data, signature) {
        await this.init();
        try {
            const ethers = EthersLib.ethers;
            const recoveredAddress = ethers.verifyTypedData(data.domain, data.types, data.message, signature);
            return this.toChecksumAddress(recoveredAddress);
        }
        catch (error) {
            console.error("Error recovering signer address:", error);
            throw error;
        }
    }
    token(tokenAddress, decimals) {
        return new erc20_1.Erc20(this, tokenAddress, decimals);
    }
    ;
    async tokenInfo(tokenAddress) {
        let erc20 = this.token(tokenAddress);
        return {
            decimals: await erc20.decimals,
            name: await erc20.name,
            symbol: await erc20.symbol,
            totalSupply: await erc20.totalSupply
        };
    }
    ;
    get utils() {
        return this._utils;
    }
    ;
    async verifyMessage(account, msg, signature) {
        await this.init();
        const ethers = EthersLib.ethers;
        try {
            const signingAddress = ethers.verifyMessage(msg, signature);
            return signingAddress.toLowerCase() === account.toLowerCase();
        }
        catch (error) {
            console.error("Error verifying message:", error);
            throw error;
        }
    }
    ;
    blockGasLimit() {
        let self = this;
        return new Promise(async (resolve, reject) => {
            await self.init();
            try {
                if (!this._gasLimit) {
                    const latestBlock = await this._ethersProvider.getBlock("latest");
                    this._gasLimit = Number(latestBlock.gasLimit);
                }
                resolve(this._gasLimit);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    ;
    getGasPrice() {
        return new Promise(async (resolve, reject) => {
            await this.init();
            try {
                const gasPrice = Number((await this._ethersProvider.getFeeData()).gasPrice);
                resolve(new bignumber_js_1.BigNumber(gasPrice));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    transactionCount() {
        return new Promise(async (resolve, reject) => {
            await this.init();
            try {
                const transactionCount = await this._ethersProvider.getTransactionCount(this.address);
                resolve(transactionCount);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    monitorTransactionEvents(promiEvent) {
        promiEvent.on('error', (error) => {
            if (error.message.startsWith("Transaction was not mined within 50 blocks")) {
                return;
            }
            if (this._sendTxEventHandler.transactionHash)
                this._sendTxEventHandler.transactionHash(error);
        });
        promiEvent.on('transactionHash', (receipt) => {
            if (this._sendTxEventHandler.transactionHash)
                this._sendTxEventHandler.transactionHash(null, receipt);
        });
        promiEvent.once('confirmation', (confirmationObj) => {
            this._sendTxEventHandler.confirmation(confirmationObj.receipt);
        });
    }
    convertEthersTransactionReceipt(ethersReceipt) {
        return {
            transactionHash: ethersReceipt.transactionHash || ethersReceipt.hash,
            transactionIndex: BigInt(ethersReceipt.transactionIndex || 0),
            blockHash: ethersReceipt.blockHash,
            blockNumber: BigInt(ethersReceipt.blockNumber || 0),
            from: ethersReceipt.from,
            to: ethersReceipt.to,
            contractAddress: ethersReceipt.contractAddress || null,
            cumulativeGasUsed: ethersReceipt.cumulativeGasUsed,
            gasUsed: ethersReceipt.gasUsed,
            logs: ethersReceipt.logs ? ethersReceipt.logs.map(log => ({
                address: log.address,
                data: log.data,
                topics: [...log.topics],
                logIndex: BigInt(log.logIndex || log.index || 0),
                transactionIndex: BigInt(log.transactionIndex || 0),
                transactionHash: log.transactionHash,
                blockHash: log.blockHash,
                blockNumber: BigInt(log.blockNumber || 0),
                removed: log.removed,
            })) : [],
            logsBloom: ethersReceipt.logsBloom,
            status: BigInt(ethersReceipt.status || 0),
            effectiveGasPrice: ethersReceipt.effectiveGasPrice,
        };
    }
    async sendTransaction(transaction) {
        await this.init();
        let signer = await this.getSigner();
        const signerTx = Object.assign(Object.assign({}, transaction), { gasPrice: transaction.gasPrice instanceof bignumber_js_1.BigNumber ? transaction.gasPrice.toFixed() : transaction.gasPrice });
        if (transaction.value) {
            signerTx.value = transaction.value instanceof bignumber_js_1.BigNumber ? transaction.value.toFixed() : transaction.value;
        }
        try {
            const transactionResponse = await signer.sendTransaction(signerTx);
            try {
                if (this._sendTxEventHandler.transactionHash)
                    this._sendTxEventHandler.transactionHash(null, transactionResponse.hash || transactionResponse.transactionHash);
                const transactionReceipt = await transactionResponse.wait();
                const receipt = this.convertEthersTransactionReceipt(transactionReceipt);
                if (this._sendTxEventHandler.confirmation)
                    this._sendTxEventHandler.confirmation(receipt);
                return receipt;
            }
            catch (error) {
                if (error.message.startsWith("Transaction was not mined within 50 blocks")) {
                    return;
                }
                if (this._sendTxEventHandler.transactionHash)
                    this._sendTxEventHandler.transactionHash(error);
                throw error;
            }
        }
        catch (error) {
            if (this._sendTxEventHandler.transactionHash)
                this._sendTxEventHandler.transactionHash(error);
            throw error;
        }
    }
    async getTransaction(transactionHash) {
        await this.init();
        const ethersTransaction = await this._ethersProvider.getTransaction(transactionHash);
        return {
            from: ethersTransaction.from,
            to: ethersTransaction.to,
            nonce: ethersTransaction.nonce,
            gas: Number(ethersTransaction.gasLimit),
            gasPrice: new bignumber_js_1.BigNumber(ethersTransaction.gasPrice.toString()),
            data: ethersTransaction.data,
            value: ethersTransaction.value ? new bignumber_js_1.BigNumber(ethersTransaction.value.toString()) : new bignumber_js_1.BigNumber(0),
        };
    }
    async getTransactionReceipt(transactionHash) {
        await this.init();
        try {
            const ethersReceipt = await this._ethersProvider.getTransactionReceipt(transactionHash);
            const receipt = this.convertEthersTransactionReceipt(ethersReceipt);
            return receipt;
        }
        catch (error) {
            console.error("Error fetching transaction receipt:", error);
            throw error;
        }
    }
    async call(transaction) {
        await this.init();
        const _transaction = {
            to: transaction.to,
            data: transaction.data,
            gasPrice: transaction.gasPrice instanceof bignumber_js_1.BigNumber ? transaction.gasPrice.toFixed() : transaction.gasPrice,
        };
        if (transaction.value) {
            _transaction.value = transaction.value instanceof bignumber_js_1.BigNumber ? transaction.value.toFixed() : transaction.value;
        }
        try {
            const result = await this._ethersProvider.call(_transaction);
            return result;
        }
        catch (error) {
            console.error("Error during call:", error);
            throw error;
        }
    }
    decodeErrorMessage(msg) {
        if (!EthersLib) {
            return msg;
        }
        const ethers = EthersLib.ethers;
        try {
            const decodedMessage = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + msg.substring(10));
            return decodedMessage[0];
        }
        catch (error) {
            console.error("Error decoding message:", error);
            throw new Error("Failed to decode error message");
        }
    }
    inferSolidityType(value) {
        const ethers = EthersLib.ethers;
        if (typeof value === 'number' || typeof value === 'bigint' || bignumber_js_1.BigNumber.isBigNumber(value)) {
            return 'uint256';
        }
        if (typeof value === 'boolean') {
            return 'bool';
        }
        if (typeof value === 'string') {
            if (ethers.isHexString(value)) {
                if (value.length === 42) {
                    try {
                        ethers.getAddress(value);
                        return 'address';
                    }
                    catch (e) {
                        return 'bytes';
                    }
                }
                return 'bytes';
            }
            return 'string';
        }
        throw new Error(`Could not infer Solidity type for value: ${JSON.stringify(value)}. Please use { t: 'type', v: 'value' } format.`);
    }
    soliditySha3(...val) {
        if (!EthersLib) {
            return '';
        }
        const ethers = EthersLib.ethers;
        const types = [];
        const values = [];
        val.forEach(item => {
            if (typeof item === 'object' &&
                item !== null &&
                't' in item &&
                'v' in item &&
                Object.keys(item).length === 2) {
                types.push(item.t);
                values.push(item.v);
            }
            else {
                types.push(this.inferSolidityType(item));
                values.push(item);
            }
        });
        try {
            const result = ethers.solidityPackedKeccak256(types, values);
            return result;
        }
        catch (error) {
            console.error("Error in soliditySha3 (ethers.js):", error);
            throw error;
        }
    }
    toChecksumAddress(address) {
        if (!EthersLib) {
            return address;
        }
        const ethers = EthersLib.ethers;
        return ethers.getAddress(address);
    }
    isAddress(address) {
        if (!EthersLib) {
            return false;
        }
        const ethers = EthersLib.ethers;
        return ethers.isAddress(address);
    }
    async multiCall(calls, gasBuffer) {
        const chainId = await this.getChainId();
        const multicallInfo = this._multicallInfoMap[chainId];
        if (!multicallInfo)
            return null;
        const multiCall = new contracts_1.MultiCall(this, multicallInfo.contractAddress);
        const result = await multiCall.multicallWithGasLimitation.call({
            calls,
            gasBuffer: new bignumber_js_1.BigNumber(gasBuffer !== null && gasBuffer !== void 0 ? gasBuffer : multicallInfo.gasBuffer)
        });
        return result;
    }
    async doMulticall(contracts, gasBuffer) {
        if (!EthersLib)
            return null;
        const chainId = await this.getChainId();
        const multicallInfo = this._multicallInfoMap[chainId];
        if (!multicallInfo)
            return null;
        const multiCall = new contracts_1.MultiCall(this, multicallInfo.contractAddress);
        let calls = [];
        for (let i = 0; i < contracts.length; i++) {
            const { to, contract, methodName, params } = contracts[i];
            const callData = this.encodeFunctionCall(contract, methodName, params);
            calls.push({
                to,
                data: callData
            });
        }
        const multicallResult = await multiCall.multicallWithGasLimitation.call({
            calls,
            gasBuffer: new bignumber_js_1.BigNumber(gasBuffer !== null && gasBuffer !== void 0 ? gasBuffer : multicallInfo.gasBuffer)
        });
        const calculateOutputValue = (decodedValue, abiOutput) => {
            let outputValue;
            if (abiOutput.type.endsWith('[]')) {
                if (abiOutput.type.startsWith('uint') || abiOutput.type.startsWith('int')) {
                    outputValue = decodedValue.map((v) => new bignumber_js_1.BigNumber(v));
                }
                else {
                    outputValue = decodedValue;
                }
            }
            else if (abiOutput.type.startsWith('uint') || abiOutput.type.startsWith('int')) {
                outputValue = new bignumber_js_1.BigNumber(decodedValue);
            }
            else {
                switch (abiOutput.type) {
                    case 'address':
                    case 'bool':
                    default:
                        outputValue = decodedValue;
                        break;
                }
            }
            return outputValue;
        };
        let outputValues = [];
        for (let i = 0; i <= multicallResult.lastSuccessIndex.toNumber(); i++) {
            const callResult = multicallResult.results[i];
            if (callResult === '0x') {
                outputValues.push(null);
                continue;
            }
            const abi = contracts[i].contract._abi.find(v => v.name == contracts[i].methodName);
            const outputs = (abi === null || abi === void 0 ? void 0 : abi.outputs) || [];
            const decodedValues = this.decodeParameters(outputs, callResult);
            if (outputs.length == 0) {
                outputValues.push(null);
            }
            else if (outputs.length == 1) {
                let outputValue = calculateOutputValue(decodedValues[0], outputs[0]);
                outputValues.push(outputValue);
            }
            else {
                let outputNames = outputs.map(v => v.name);
                if (outputNames.every(v => v !== '')) {
                    let outputValueObj = {};
                    for (let j = 0; j < outputs.length; j++) {
                        const output = outputs[j];
                        const decodedValue = decodedValues[j];
                        const outputValue = calculateOutputValue(decodedValue, output);
                        outputValueObj[outputNames[j]] = outputValue;
                    }
                    outputValues.push(outputValueObj);
                }
                else {
                    let outputValueArr = [];
                    for (let j = 0; j < outputs.length; j++) {
                        const output = outputs[j];
                        const decodedValue = decodedValues[j];
                        const outputValue = calculateOutputValue(decodedValue, output);
                        outputValueArr.push(outputValue);
                    }
                    outputValues.push(outputValueArr);
                }
            }
        }
        return outputValues;
    }
    encodeFunctionCall(contract, methodName, params) {
        if (EthersLib) {
            const ethers = EthersLib.ethers;
            const abi = contract._abi.find(v => v.name == methodName);
            if (!abi) {
                throw new Error(`Method ${String(methodName)} not found in ABI`);
            }
            const iface = new ethers.Interface(contract._abi);
            return iface.encodeFunctionData(String(methodName), params);
        }
    }
    decodeAbiEncodedParameters(contract, methodName, hexString) {
        if (EthersLib) {
            const abi = contract._abi.find(v => v.name == methodName);
            const outputs = (abi === null || abi === void 0 ? void 0 : abi.outputs) || [];
            return abi ? this.decodeParameters(outputs, hexString) : {};
        }
    }
}
Wallet._rpcWalletPoolMap = {};
Wallet.instance = new Wallet();
exports.Wallet = Wallet;
class RpcWallet extends Wallet {
    get address() {
        return this._address;
    }
    set address(value) {
        this._address = value;
    }
    setProvider(provider) {
        this._provider = provider;
    }
    ;
    get isConnected() {
        const clientWallet = Wallet.getClientInstance();
        return clientWallet.isConnected && this.chainId === clientWallet.chainId;
    }
    ;
    static getRpcWallet(chainId) {
        var _a, _b, _c;
        if (this.rpcWalletRegistry[chainId]) {
            return this.rpcWalletRegistry[chainId];
        }
        const application = window["application"];
        if (!application)
            throw new Error("application is not initialized");
        const clientWallet = Wallet.getClientInstance();
        const networkList = Object.values(((_a = application.store) === null || _a === void 0 ? void 0 : _a.networkMap) || []);
        const instanceId = clientWallet.initRpcWallet({
            networks: networkList,
            defaultChainId: chainId,
            infuraId: (_b = application.store) === null || _b === void 0 ? void 0 : _b.infuraId,
            multicalls: (_c = application.store) === null || _c === void 0 ? void 0 : _c.multicalls
        });
        const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
        this.rpcWalletRegistry[chainId] = rpcWallet;
        if (clientWallet.address) {
            rpcWallet.address = clientWallet.address;
        }
        return rpcWallet;
    }
    async switchNetwork(chainId) {
        await this.init();
        this.chainId = chainId;
        const ethers = EthersLib.ethers;
        this._ethersProvider = new ethers.JsonRpcProvider(this._provider);
        const eventId = `${this.instanceId}:${constants_1.RpcWalletEvent.ChainChanged}`;
        eventBus_1.EventBus.getInstance().dispatch(eventId, chainId);
        return null;
    }
    initWalletEvents() {
        const eventId = `${this.instanceId}:${constants_1.RpcWalletEvent.Connected}`;
        const eventBus = eventBus_1.EventBus.getInstance();
        const accountsChangedRegistry = eventBus.register(this, constants_1.ClientWalletEvent.AccountsChanged, (payload) => {
            this.address = payload.account;
            eventBus.dispatch(eventId, this.isConnected);
        });
        const chainChangedRegistry = eventBus.register(this, constants_1.ClientWalletEvent.ChainChanged, (chainIdHex) => {
            eventBus.dispatch(eventId, this.isConnected);
        });
        this._walletEventIds.add(accountsChangedRegistry.id);
        this._walletEventIds.add(chainChangedRegistry.id);
    }
    registerWalletEvent(sender, event, callback) {
        const eventId = `${this.instanceId}:${event}`;
        const eventBus = eventBus_1.EventBus.getInstance();
        const registry = eventBus.register(sender, eventId, callback);
        this._walletEventIds.add(registry.id);
        return registry;
    }
}
RpcWallet.rpcWalletRegistry = {};
exports.RpcWallet = RpcWallet;
