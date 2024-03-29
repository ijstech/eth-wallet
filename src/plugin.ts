/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/
///<amd-module name='@ijstech/eth-wallet'/>
export {
    IWallet, 
    IWalletUtils, 
    IAccount, 
    Wallet, 
    Transaction, 
    Event, 
    TransactionReceipt, 
    ISendTxEventsOptions, 
    IClientProviderOptions,
    IBatchRequestObj,
    INetwork,
    EthereumProvider,
    MetaMaskProvider,
    Web3ModalProvider,
    IClientSideProviderEvents,
    IClientSideProvider,
    IClientWalletConfig,
    IClientWallet,
    IMulticallInfo,
    RpcWallet,
    IRpcWalletConfig,
    IRpcWallet,
    IConnectWalletEventPayload,
    IMulticallContractCall
} from './wallet';
export {Contract} from './contract';
export {BigNumber} from "bignumber.js";
export {Erc20} from './contracts/erc20';
export * as Utils from './utils';
export * as Contracts from './contracts';
export * as Types from './types';
export * as Constants from './constants';
export {IEventBusRegistry, EventBus} from './eventBus';
export {
    getERC20Allowance,
    IERC20ApprovalEventOptions,
    IERC20ApprovalOptions,
    IERC20ApprovalAction,
    ERC20ApprovalModel
} from './approvalModel';