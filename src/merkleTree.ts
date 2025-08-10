/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/

import { BigNumber } from "bignumber.js";
import { Wallet } from "./wallet";
import { IMerkleTreeAbiItem } from "./nodeTypes";
import { getSha3HashBufferFunc } from "./nodeUtils";

interface IMerkleNodeInfo {
    parent: string;
    sibling?: string;
}

export interface IMerkleTreeOptions {
    leavesData: Record<string, any>[];
    abi: IMerkleTreeAbiItem[];
    abiKeyName?: string;
    getCustomKey?: (leafData: Record<string, any>) => string;
}

export interface IGetMerkleProofOptions {
    leafData?: Record<string, any>;
    key?: string;
}

export interface IGetMerkleLeafDataOptions {
    key?: string;
    hash?: string;
}

export class MerkleTree {
    private tree: string[][] = [];
    public leavesData: Record<string, any> = {};
    private leavesKeyHashMap: Record<string, string[]> = {};
    private leavesHashDataMap: Record<string, Record<string, any>> = {};
    private abi: IMerkleTreeAbiItem[];
    private nodeInfoMap: Record<number, Record<string, IMerkleNodeInfo>> = {};
    constructor(wallet: Wallet, options: IMerkleTreeOptions) {
        this.abi = options.abi;
        const hashFunc = getSha3HashBufferFunc(wallet, options.abi);
        let abiKeyName = options.abiKeyName || options.abi[0].name;
        this.leavesData = options.leavesData;
        let leaves = [];
        for (let leafData of options.leavesData) {
            let key: string;
            if (options.getCustomKey) {
                key = options.getCustomKey(leafData);
            }
            else {
                key = leafData[abiKeyName];
            }
            let dataHash = hashFunc(leafData);
            this.leavesKeyHashMap[key] = this.leavesKeyHashMap[key] || [];
            this.leavesKeyHashMap[key].push(dataHash);
            this.leavesHashDataMap[dataHash] = leafData;
            leaves.push(dataHash);
        }
        this.tree.push(leaves);
        while (this.tree[this.tree.length - 1].length > 1) {
            let layer = this.tree.length - 1;
            let children = this.tree[layer];
            let parent = [];
            this.nodeInfoMap[layer] = {};
            for (let i = 0; i < children.length - 1; i += 2) {
                let parentHash;
                let firstChild = children[i];
                let secondChild = children[i + 1];
                if (new BigNumber(firstChild).lt(secondChild)) {
                    parentHash = wallet.soliditySha3("0x" + firstChild.replace("0x", "") + secondChild.replace("0x", ""));            
                } else {
                    parentHash = wallet.soliditySha3("0x" + secondChild.replace("0x", "") + firstChild.replace("0x", ""));
                }
                parent.push(parentHash);
                this.nodeInfoMap[layer][firstChild] = {
                    parent: parentHash,
                    sibling: secondChild
                }
                this.nodeInfoMap[layer][secondChild] = {
                    parent: parentHash,
                    sibling: firstChild
                }
            }
            if (children.length % 2 == 1) {
                let child = children[children.length - 1];
                let parentHash = "0x" + child.replace("0x", "");
                parent.push(parentHash);
                this.nodeInfoMap[layer][child] = {
                    parent: parentHash
                }
            }
            this.tree.push(parent);
        }
    }
    toString(){
        let arr = [];
        for (let i = this.tree.length - 1; i >= 0; i--) {
            arr.push(this.tree[i].join(','));
        }
        return arr.join(',');
    }
    getHexRoot() {
        return this.tree[this.tree.length - 1][0];
    }
    getHexProofsByKey(key: string) {
        let proofs: string[][] = [];
        let leaves = this.leavesKeyHashMap[key] || [];
        if (leaves.length == 0) return [];
        for (let leaf of leaves) {
            proofs.push(this.getHexProof(leaf));
        }
        return proofs; 
    }
    getHexProof(leaf: string) {
        let proof = [];
        if (this.tree.length == 1) return proof;
        let leafInfo = this.nodeInfoMap[0][leaf];
        if (leafInfo.sibling) {
            proof.push(leafInfo.sibling)
        }
        let parentHash = leafInfo.parent;
        for (let i = 1; i < this.tree.length - 1; i++) {
            if (parentHash == this.getHexRoot()) break;
            let leafInfo = this.nodeInfoMap[i][parentHash];
            if (leafInfo.sibling) {
                proof.push(leafInfo.sibling)
            }
            parentHash = leafInfo.parent;
        }
        return proof;
    } 
    getABI() {
        return this.abi;
    } 
    getLeavesByKey(key: string) {
        return this.leavesKeyHashMap[key] || [];
    }
    getLeavesDataByKey(key: string) {
        let leaves = this.leavesKeyHashMap[key] || [];
        if (leaves.length == 0) return [];
        let leavesData: Record<string, any>[] = []
        for (let leaf of leaves) {
            leavesData.push(this.getLeafData(leaf));
        }
        return leavesData;
    }  
    getLeafData(leaf: string) {
        return this.leavesHashDataMap[leaf];
    }
}