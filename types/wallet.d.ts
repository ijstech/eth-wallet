/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/
import { ConfirmationObject, TransactionReceipt } from './web3';
import { BigNumber } from 'bignumber.js';
import { Erc20 } from './contracts/erc20';
import { IAbiDefinition, MessageTypes, TypedMessage } from './types';
import { IEventBusRegistry } from './eventBus';
export { TransactionReceipt, ConfirmationObject };
export declare function toString(value: any): any;
export type stringArray = string | _stringArray;
export interface _stringArray extends Array<stringArray> {
}
export interface IWalletUtils {
    fromDecimals(value: BigNumber | number | string, decimals?: number): BigNumber;
    fromWei(value: any, unit?: string): string;
    hexToUtf8(value: string): string;
    sha3(value: string): string;
    stringToBytes(value: string | stringArray, nByte?: number): string | string[];
    stringToBytes32(value: string | stringArray): string | string[];
    toDecimals(value: BigNumber | number | string, decimals?: number): BigNumber;
    toString(value: any): string;
    toUtf8(value: any): string;
    toWei(value: string, unit?: string): string;
}
export interface IWalletTransaction {
    hash: string;
    nonce: bigint;
    blockHash: string | null;
    blockNumber: bigint | null;
    transactionIndex: bigint | null;
    from: string;
    to: string | null;
    value: BigNumber;
    gasPrice: BigNumber;
    maxPriorityFeePerGas?: bigint | string | BigNumber;
    maxFeePerGas?: bigint | string | BigNumber;
    gas: bigint;
    input: string;
}
export interface IWalletBlockTransactionObject {
    number: bigint;
    hash: string;
    parentHash: string;
    nonce: string;
    sha3Uncles: string;
    logsBloom: string;
    transactionRoot: string;
    stateRoot: string;
    receiptsRoot: string;
    miner: string;
    extraData: string;
    gasLimit: bigint;
    gasUsed: bigint;
    timestamp: bigint | string;
    baseFeePerGas?: bigint;
    size: bigint;
    difficulty: bigint;
    totalDifficulty: bigint;
    uncles: string[];
    transactions: IWalletTransaction[];
}
export interface ITokenInfo {
    name: string;
    symbol: string;
    totalSupply: BigNumber;
    decimals: number;
}
export interface IBatchRequestResult {
    key: string;
    result: any;
}
export interface IBatchRequestObj {
    batch: any;
    promises: Promise<IBatchRequestResult>[];
    execute: (batch: IBatchRequestObj, promises: Promise<IBatchRequestResult>[]) => Promise<IBatchRequestResult[]>;
}
export interface IConnectWalletEventPayload {
    userTriggeredConnect?: boolean;
    [key: string]: any;
}
export interface IWallet {
    account: IAccount;
    accounts: Promise<string[]>;
    address: string;
    balance: Promise<BigNumber>;
    balanceOf(address: string): Promise<BigNumber>;
    _call(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<any>;
    chainId: number;
    createAccount(): IAccount;
    decode(abi: any, event: Log | EventLog, raw?: {
        data: string;
        topics: string[];
    }): Event;
    decodeErrorMessage(msg: string): any;
    decodeEventData(data: Log, events?: any): Promise<Event>;
    decodeLog(inputs: any, hexString: string, topics: any): any;
    decodeParameters(types: string[], hexString: string): any;
    encodeParameters(types: string[], values: any[]): string;
    defaultAccount: string;
    getAbiEvents(abi: any[]): any;
    getAbiTopics(abi: any[], eventNames: string[]): any[];
    getBlock(blockHashOrBlockNumber?: number | string, returnTransactionObjects?: boolean): Promise<IWalletBlockTransactionObject>;
    getBlockNumber(): Promise<number>;
    getBlockTimestamp(blockHashOrBlockNumber?: number | string): Promise<number>;
    getChainId(): Promise<number>;
    getContractAbi(address: string): any;
    getContractAbiEvents(address: string): any;
    getTransaction(transactionHash: string): Promise<Transaction>;
    methods(...args: any): Promise<any>;
    privateKey: string;
    recoverSigner(msg: string, signature: string): Promise<string>;
    registerAbi(abi: any[] | string, address?: string | string[], handler?: any): string;
    registerAbiContracts(abiHash: string, address: string | string[], handler?: any): any;
    send(to: string, amount: number): Promise<TransactionReceipt>;
    _send(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<any>;
    scanEvents(fromBlock: number, toBlock?: number | string, topics?: any, events?: any, address?: string | string[]): Promise<Event[]>;
    scanEvents(params: {
        fromBlock: number;
        toBlock?: number | string;
        topics?: any;
        events?: any;
        address?: string | string[];
    }): Promise<Event[]>;
    signMessage(msg: string): Promise<string>;
    signTransaction(tx: any, privateKey?: string): Promise<string>;
    soliditySha3(...val: any[]): string;
    toChecksumAddress(address: string): string;
    isAddress(address: string): boolean;
    tokenInfo(address: string): Promise<ITokenInfo>;
    _txData(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<string>;
    _txObj(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<Transaction>;
    utils: IWalletUtils;
    verifyMessage(account: string, msg: string, signature: string): Promise<boolean>;
    multiCall(calls: {
        to: string;
        data: string;
    }[], gasBuffer?: string): Promise<{
        results: string[];
        lastSuccessIndex: BigNumber;
    }>;
    doMulticall(contracts: IMulticallContractCall[], gasBuffer?: string): Promise<any[]>;
    encodeFunctionCall<T extends IAbiDefinition, F extends Extract<keyof T, {
        [K in keyof T]: T[K] extends Function ? K : never;
    }[keyof T]>>(contract: T, methodName: F, params: string[]): string;
    decodeAbiEncodedParameters<T extends IAbiDefinition, F extends Extract<keyof T, {
        [K in keyof T]: T[K] extends Function ? K : never;
    }[keyof T]>>(contract: T, methodName: F, hexString: string): any;
}
export interface IClientWallet extends IWallet {
    init(): Promise<void>;
    blockGasLimit(): Promise<number>;
    clientSideProvider: IClientSideProvider;
    initClientWallet(config: IClientWalletConfig): void;
    connect(clientSideProvider: IClientSideProvider, eventPayload?: Record<string, any>): Promise<any>;
    disconnect(): Promise<void>;
    getGasPrice(): Promise<BigNumber>;
    getTransaction(transactionHash: string): Promise<Transaction>;
    getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;
    isConnected: boolean;
    provider: any;
    registerEvent(abi: any, eventMap: {
        [topics: string]: any;
    }, address: string, handler: any): any;
    registerSendTxEvents(eventsOptions: ISendTxEventsOptions): void;
    sendSignedTransaction(signedTransaction: string): Promise<TransactionReceipt>;
    sendTransaction(transaction: Transaction): Promise<TransactionReceipt>;
    signTypedDataV4(data: TypedMessage<MessageTypes>): Promise<string>;
    switchNetwork(chainId: number): Promise<boolean>;
    transactionCount(): Promise<number>;
    getNetworkInfo(chainId: number): INetwork;
    setNetworkInfo(network: INetwork): void;
    setMultipleNetworksInfo(networks: INetwork[]): void;
    registerWalletEvent(sender: any, event: string, callback: Function): IEventBusRegistry;
    unregisterWalletEvent(registry: IEventBusRegistry): void;
    unregisterAllWalletEvents(): void;
    destoryRpcWalletInstance(instanceId: string): void;
    initRpcWallet(config: IRpcWalletConfig): string;
    encrypt: (key: string) => Promise<string>;
    decrypt: (data: string) => Promise<string>;
}
export interface IRpcWallet extends IWallet {
    init(): Promise<void>;
    instanceId: string;
    isConnected: boolean;
    switchNetwork(chainId: number): Promise<boolean>;
    registerWalletEvent(sender: any, event: string, callback: Function): IEventBusRegistry;
    unregisterAllWalletEvents(): void;
    unregisterWalletEvent(registry: IEventBusRegistry): void;
}
export interface IContractMethod {
    call: any;
    estimateGas(...params: any[]): Promise<bigint>;
    encodeABI(): string;
}
export interface IContract {
    deploy(params: {
        data: string;
        arguments?: any[];
    }): IContractMethod;
    methods: {
        [methodName: string]: (...params: any[]) => IContractMethod;
    };
    options: {
        address: string;
    };
}
export interface Event {
    name: string;
    address: string;
    blockNumber: bigint;
    logIndex: bigint;
    topics: string[];
    transactionHash: string;
    transactionIndex: bigint;
    data: any;
    rawData: any;
}
export interface Log {
    address: string;
    data: string;
    topics: Array<string>;
    logIndex: bigint;
    transactionHash?: string;
    transactionIndex: bigint;
    blockHash?: string;
    type?: string;
    blockNumber: bigint;
}
export interface EventLog {
    event: string;
    address: string;
    returnValues: any;
    logIndex: bigint;
    transactionIndex: bigint;
    transactionHash: string;
    blockHash: string;
    blockNumber: bigint;
    raw?: {
        data: string;
        topics: string[];
    };
}
export interface Transaction {
    from?: string;
    to?: string;
    nonce?: number;
    gas?: number;
    gasLimit?: number;
    gasPrice?: BigNumber | number;
    data?: string;
    value?: BigNumber | number;
}
export interface TransactionOptions {
    from?: string;
    to?: string;
    nonce?: number;
    gas?: number;
    gasLimit?: number;
    gasPrice?: string | BigNumber | number;
    data?: string;
    value?: BigNumber | number | string;
}
export interface IKMS {
}
export interface IAccount {
    address: string;
    privateKey?: string;
    kms?: IKMS;
    sign?(): Promise<string>;
    signTransaction?(): Promise<any>;
}
export interface ITokenOption {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
}
export interface INetwork {
    image?: string;
    networkCode?: string;
    networkType?: string;
    chainId?: number;
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
}
export interface IClientSideProviderEvents {
    onAccountChanged?: (account: string) => void;
    onChainChanged?: (chainId: string) => void;
    onConnect?: (connectInfo: any) => void;
    onDisconnect?: (error: any) => void;
}
export interface IMulticallInfo {
    chainId: number;
    contractAddress: string;
    gasBuffer: string;
}
export type NetworksMapType = {
    [chainId: number]: INetwork;
};
export type MulticallInfoMapType = {
    [chainId: number]: IMulticallInfo;
};
export interface IMulticallContractCall {
    to: string;
    contract: IAbiDefinition;
    methodName: string;
    params: any[];
}
export interface IRpcWalletConfig {
    networks: INetwork[];
    defaultChainId?: number;
    infuraId: string;
    multicalls?: IMulticallInfo[];
}
export interface IClientWalletConfig {
    defaultChainId: number;
    networks: INetwork[];
    infuraId: string;
    multicalls?: IMulticallInfo[];
}
export interface IClientProviderOptions {
    name?: string;
    image?: string;
    infuraId?: string;
    useDefaultProvider?: boolean;
    [key: string]: any;
}
export interface IClientSideProvider {
    name: string;
    displayName: string;
    provider: any;
    selectedAddress: string;
    image: string;
    homepage?: string;
    events?: IClientSideProviderEvents;
    options?: IClientProviderOptions;
    installed(): boolean;
    isConnected(): boolean;
    connect: (eventPayload?: Record<string, any>) => Promise<void>;
    disconnect: () => Promise<void>;
    switchNetwork?: (chainId: number, onChainChanged?: (chainId: string) => void) => Promise<boolean>;
    encrypt: (key: string) => Promise<string>;
    decrypt: (data: string) => Promise<string>;
}
export declare class EthereumProvider implements IClientSideProvider {
    protected wallet: Wallet;
    protected _events?: IClientSideProviderEvents;
    protected _options?: IClientProviderOptions;
    protected _isConnected: boolean;
    protected _name: string;
    protected _image: string;
    protected _selectedAddress: string;
    onAccountChanged: (account: string) => void;
    onChainChanged: (chainId: string) => void;
    onConnect: (connectInfo: any) => void;
    onDisconnect: (error: any) => void;
    private handleAccountsChanged;
    private handleChainChanged;
    private handleConnect;
    private handleDisconnect;
    constructor(wallet: Wallet, events?: IClientSideProviderEvents, options?: IClientProviderOptions);
    get name(): string;
    get displayName(): string;
    get provider(): any;
    get image(): string;
    installed(): boolean;
    get events(): IClientSideProviderEvents;
    get options(): IClientProviderOptions;
    get selectedAddress(): string;
    protected toChecksumAddress(address: string): string;
    protected removeListeners(): void;
    private _handleAccountsChanged;
    protected initEvents(): void;
    connect(eventPayload?: IConnectWalletEventPayload): Promise<any>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    addToken(option: ITokenOption, type?: string): Promise<boolean>;
    switchNetwork(chainId: number): Promise<boolean>;
    encrypt(key: string): Promise<string>;
    decrypt(data: string): Promise<string>;
}
export declare class MetaMaskProvider extends EthereumProvider {
    get displayName(): string;
    get image(): string;
    get homepage(): string;
    installed(): boolean;
    encrypt(key: string): Promise<string>;
    decrypt(data: string): Promise<string>;
}
export declare class Web3ModalProvider extends EthereumProvider {
    private _provider;
    constructor(wallet: Wallet, events?: IClientSideProviderEvents, options?: IClientProviderOptions);
    get name(): string;
    get displayName(): string;
    get provider(): any;
    get image(): string;
    get homepage(): any;
    installed(): boolean;
    get options(): IClientProviderOptions;
    private initializeWeb3Modal;
    connect(eventPayload?: IConnectWalletEventPayload): Promise<any>;
    disconnect(): Promise<void>;
}
export interface ISendTxEventsOptions {
    transactionHash?: (error: Error, receipt?: string) => void;
    confirmation?: (receipt: any) => void;
}
export declare class Wallet implements IClientWallet {
    protected _ethersProvider: any;
    protected _ethersSigner: any;
    protected _defaultAccount: string;
    protected _account: IAccount;
    private _accounts;
    protected _provider: any;
    private _eventTopicAbi;
    private _eventHandler;
    protected _sendTxEventHandler: ISendTxEventsOptions;
    protected _contracts: {};
    protected _blockGasLimit: number;
    private _networksMap;
    private _multicallInfoMap;
    chainId: number;
    clientSideProvider: IClientSideProvider;
    private _infuraId;
    protected _utils: IWalletUtils;
    private static _rpcWalletPoolMap;
    protected _walletEventIds: Set<number>;
    constructor(provider?: any, account?: IAccount | IAccount[]);
    private static readonly instance;
    static getInstance(): IWallet;
    static getClientInstance(): IClientWallet;
    static getRpcWalletInstance(instanceId: string): IRpcWallet;
    private fromWei;
    private toWei;
    private hexToUtf8;
    private toUtf8;
    init(): Promise<void>;
    protected privateKeyToAccount(privateKey: string): IAccount;
    get isConnected(): boolean;
    switchNetwork(chainId: number): Promise<any>;
    initClientWallet(config: IClientWalletConfig): void;
    registerWalletEvent(sender: any, event: string, callback: Function): IEventBusRegistry;
    unregisterWalletEvent(registry: IEventBusRegistry): void;
    unregisterAllWalletEvents(): void;
    destoryRpcWalletInstance(instanceId: string): void;
    private generateUUID;
    initRpcWallet(config: IRpcWalletConfig): string;
    setDefaultProvider(): void;
    connect(clientSideProvider: IClientSideProvider, eventPayload?: IConnectWalletEventPayload): Promise<void>;
    disconnect(): Promise<void>;
    encrypt(key: string): Promise<string>;
    decrypt(data: string): Promise<string>;
    get accounts(): Promise<string[]>;
    get address(): string;
    get account(): IAccount;
    set account(value: IAccount);
    get infuraId(): string;
    set infuraId(value: string);
    get networksMap(): NetworksMapType;
    get multicallInfoMap(): MulticallInfoMapType;
    set multicallInfoMap(value: MulticallInfoMapType);
    getNetworkInfo(chainId: number): INetwork;
    setNetworkInfo(network: INetwork): void;
    setMultipleNetworksInfo(networks: INetwork[]): void;
    createAccount(): IAccount;
    decodeLog(inputs: any, hexString: string, topics: any): any;
    get defaultAccount(): string;
    set defaultAccount(address: string);
    getChainId(): Promise<number>;
    get provider(): any;
    set provider(value: any);
    sendSignedTransaction(tx: string): Promise<TransactionReceipt>;
    signTransaction(tx: any, privateKey?: string): Promise<string>;
    registerSendTxEvents(eventsOptions: ISendTxEventsOptions): void;
    _call(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<any>;
    protected _createTxData(signer: any, abiHash: string, address: string, methodName: string, params?: any[]): Promise<any>;
    protected _createTxObj(address: string, txData: any, options?: number | BigNumber | TransactionOptions): Promise<any>;
    _txObj(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<Transaction>;
    protected getSigner(): Promise<any>;
    protected extractEthersErrorInfo(errorString: string): {
        action: string;
        reason: string;
        errorCode: number;
        message: string;
    };
    _send(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<TransactionReceipt>;
    _txData(abiHash: string, address: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<string>;
    methods(...args: any): Promise<any>;
    get balance(): Promise<BigNumber>;
    balanceOf(address: string): Promise<BigNumber>;
    recoverSigner(msg: string, signature: string): Promise<string>;
    getBlock(blockHashOrBlockNumber?: number | string, returnTransactionObjects?: boolean): Promise<IWalletBlockTransactionObject>;
    getBlockNumber(): Promise<number>;
    getBlockTimestamp(blockHashOrBlockNumber?: number | string): Promise<number>;
    set privateKey(value: string);
    private sha3;
    registerEvent(abi: any, eventMap: {
        [topics: string]: any;
    }, address: string, handler: any): Promise<void>;
    private _abiHashDict;
    private _abiContractDict;
    private _abiAddressDict;
    private _abiEventDict;
    getAbiEvents(abi: any[]): any;
    getAbiTopics(abi: any[], eventNames?: string[]): any[];
    getContractAbi(address: string): any;
    getContractAbiEvents(address: string): any;
    registerAbi(abi: any[] | string, address?: string | string[], handler?: any): string;
    registerAbiContracts(abiHash: string, address: string | string[], handler?: any): void;
    decode(abi: any, event: Log | EventLog, raw?: {
        data: string;
        topics: string[];
    }): Event;
    decodeEventData(data: Log, events?: any): Promise<Event>;
    encodeParameters(types: string[], values: any[]): string;
    decodeParameters(types: string[], hexString: string): any;
    scanEvents(params: {
        fromBlock: number;
        toBlock?: number | string;
        topics?: any;
        events?: any;
        address?: string | string[];
    }): Promise<Event[]>;
    scanEvents(fromBlock: number, toBlock?: number | string, topics?: any, events?: any, address?: string | string[]): Promise<Event[]>;
    send(to: string, amount: number | BigNumber): Promise<TransactionReceipt>;
    estimateGas(tx: TransactionOptions): Promise<string>;
    setBlockTime(time: number): Promise<any>;
    increaseBlockTime(value: number): Promise<any>;
    signMessage(msg: string): Promise<string>;
    signTypedDataV4(data: TypedMessage<MessageTypes>): Promise<string>;
    recoverTypedSignatureV4(data: TypedMessage<MessageTypes>, signature: string): Promise<string>;
    token(tokenAddress: string, decimals?: number): Erc20;
    tokenInfo(tokenAddress: string): Promise<ITokenInfo>;
    get utils(): IWalletUtils;
    verifyMessage(account: string, msg: string, signature: string): Promise<boolean>;
    private _gasLimit;
    blockGasLimit(): Promise<number>;
    getGasPrice(): Promise<BigNumber>;
    transactionCount(): Promise<number>;
    private monitorTransactionEvents;
    protected convertEthersTransactionReceipt(ethersReceipt: any): TransactionReceipt;
    sendTransaction(transaction: TransactionOptions): Promise<TransactionReceipt>;
    getTransaction(transactionHash: string): Promise<Transaction>;
    getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;
    call(transaction: Transaction): Promise<any>;
    decodeErrorMessage(msg: string): string;
    protected inferSolidityType(value: any): string;
    soliditySha3(...val: any[]): string;
    toChecksumAddress(address: string): string;
    isAddress(address: string): boolean;
    multiCall(calls: {
        to: string;
        data: string;
    }[], gasBuffer?: string): Promise<{
        results: string[];
        lastSuccessIndex: BigNumber;
    }>;
    doMulticall(contracts: IMulticallContractCall[], gasBuffer?: string): Promise<any[]>;
    encodeFunctionCall<T extends IAbiDefinition, F extends Extract<keyof T, {
        [K in keyof T]: T[K] extends Function ? K : never;
    }[keyof T]>>(contract: T, methodName: F, params: string[]): string;
    decodeAbiEncodedParameters<T extends IAbiDefinition, F extends Extract<keyof T, {
        [K in keyof T]: T[K] extends Function ? K : never;
    }[keyof T]>>(contract: T, methodName: F, hexString: string): any;
}
export declare class RpcWallet extends Wallet implements IRpcWallet {
    static rpcWalletRegistry: Record<string, IRpcWallet>;
    instanceId: string;
    private _address;
    get address(): string;
    set address(value: string);
    setProvider(provider: any): void;
    get isConnected(): boolean;
    static getRpcWallet(chainId: number): IRpcWallet;
    switchNetwork(chainId: number): Promise<any>;
    initWalletEvents(): void;
    registerWalletEvent(sender: any, event: string, callback: Function): IEventBusRegistry;
}
