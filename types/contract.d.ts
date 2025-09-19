/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/
import { IWallet, TransactionReceipt, Event, IBatchRequestObj } from "./wallet";
import { BigNumber } from 'bignumber.js';
declare module Contract {
    export interface EventType {
        name: string;
    }
    export interface TransactionOptions {
        from?: string;
        to?: string;
        nonce?: number;
        gas?: number;
        gasLimit?: number;
        gasPrice?: BigNumber | number;
        data?: string;
        value?: BigNumber | number;
    }
    export interface DeployOptions extends TransactionOptions {
        libraries?: {
            [file: string]: {
                [contract: string]: string;
            };
        };
    }
    interface LinkReferences {
        [file: string]: {
            [contract: string]: {
                length: number;
                start: number;
            }[];
        };
    }
    export class Contract {
        wallet: IWallet;
        _abi: any;
        _bytecode: string;
        _linkReferences: LinkReferences;
        _address: string;
        private _events;
        privateKey: string;
        private abiHash;
        constructor(wallet: IWallet, address?: string, abi?: any, bytecode?: string, linkReferences?: LinkReferences);
        at(address: string): Contract;
        set address(value: string);
        get address(): string;
        protected decodeEvents(receipt: TransactionReceipt): any[];
        protected parseEvents(receipt: TransactionReceipt, eventName: string): Event[];
        get events(): EventType[];
        getAbiEvents(): any;
        getAbiTopics(eventNames?: string[]): any[];
        scanEvents(fromBlock: number, toBlock: number | string, eventNames?: string[]): Promise<Event[]>;
        batchCall(batchObj: IBatchRequestObj, key: string, methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<void>;
        protected txData(methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<string>;
        protected call(methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<any>;
        private _send;
        getDeployBytecode(options?: number | BigNumber | DeployOptions): string;
        protected __deploy(params?: any[], options?: number | BigNumber | DeployOptions): Promise<string>;
        protected send(methodName: string, params?: any[], options?: number | BigNumber | TransactionOptions): Promise<TransactionReceipt>;
        protected _deploy(...params: any[]): Promise<string>;
        protected methods(methodName: string, ...params: any[]): Promise<any>;
    }
    export {};
}
export = Contract;
