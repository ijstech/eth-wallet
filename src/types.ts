 /*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/ 
/*---------------------------------------------------------------------------------------------
*  ISC License
*  Copyright (c) 2020 MetaMask
*  https://github.com/MetaMask/eth-sig-util/blob/main/LICENSE
*--------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------------------
*  MIT License
*  Copyright (c) 2016 Nick Dodson. nickdodson.com
*  https://github.com/ethereumjs/ethereumjs-monorepo/tree/master/packages/util
*--------------------------------------------------------------------------------------------*/

export interface MessageTypeProperty {
    name: string;
    type: string;
}

export type EIP712TypeMap = { [type: string]: MessageTypeProperty[] };

export interface IEIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}	

export enum SignTypedDataVersion {
    V1 = "V1",
    V3 = "V3",
    V4 = "V4"
}

export interface MessageTypes {
    EIP712Domain: MessageTypeProperty[];
    [additionalProperties: string]: MessageTypeProperty[];
}

export interface TypedMessage<T extends MessageTypes> {
    types: T;
    primaryType: keyof T;
    domain: {
        name?: string;
        version?: string;
        chainId?: number;
        verifyingContract?: string;
        salt?: ArrayBuffer;
    };
    message: Record<string, unknown>;
}

export interface IAbiDefinition {
    _abi: any;
    [key: string]: any;
}

export interface ITokenObject {
    address?: string;
    name: string;
    decimals: number;
    symbol: string;
};

declare namespace nacl {
    export interface BoxKeyPair {
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    }

    export interface SignKeyPair {
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    }

    export interface secretbox {
        (msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array | null;
        readonly keyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    }

    export interface scalarMult {
        (n: Uint8Array, p: Uint8Array): Uint8Array;
        base(n: Uint8Array): Uint8Array;
        readonly scalarLength: number;
        readonly groupElementLength: number;
    }

    namespace boxProps {
        export interface open {
            (msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array | null;
            after(box: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array | null;
        }

        export interface keyPair {
            (): BoxKeyPair;
            fromSecretKey(secretKey: Uint8Array): BoxKeyPair;
        }
    }

    export interface box {
        (msg: Uint8Array, nonce: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        before(publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
        after(msg: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
        open: boxProps.open;
        keyPair: boxProps.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly sharedKeyLength: number;
        readonly nonceLength: number;
        readonly overheadLength: number;
    }

    namespace signProps {
        export interface detached {
            (msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
            verify(msg: Uint8Array, sig: Uint8Array, publicKey: Uint8Array): boolean;
        }

        export interface keyPair {
            (): SignKeyPair;
            fromSecretKey(secretKey: Uint8Array): SignKeyPair;
            fromSeed(secretKey: Uint8Array): SignKeyPair;
        }
    }

    export interface sign {
        (msg: Uint8Array, secretKey: Uint8Array): Uint8Array;
        open(signedMsg: Uint8Array, publicKey: Uint8Array): Uint8Array | null;
        detached: signProps.detached;
        keyPair: signProps.keyPair;
        readonly publicKeyLength: number;
        readonly secretKeyLength: number;
        readonly seedLength: number;
        readonly signatureLength: number;
    }

    export interface hash {
        (msg: Uint8Array): Uint8Array;
        readonly hashLength: number;
    }
}

export interface INacl {
    randomBytes(n: number): Uint8Array;
    secretbox: nacl.secretbox;
    scalarMult: nacl.scalarMult;
    box: nacl.box;
    sign: nacl.sign;
    hash: nacl.hash;
    verify(x: Uint8Array, y: Uint8Array): boolean;
    setPRNG(fn: (x: Uint8Array, n: number) => void): void;
}