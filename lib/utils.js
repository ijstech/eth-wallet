"use strict";
/*!-----------------------------------------------------------
* Copyright (c) IJS Technologies. All rights reserved.
* Released under dual AGPLv3/commercial license
* https://ijs.network
*-----------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexToString = exports.stringToUnicodeHex = exports.uint8ArrayToHex = exports.registerSendTxEvents = exports.toChecksumAddress = exports.soliditySha3 = exports.constructTypedMessageData = exports.nullAddress = exports.toString = exports.fromDecimals = exports.toDecimals = exports.toNumber = exports.addressToBytes32Right = exports.bytes32ToString = exports.bytes32ToAddress = exports.addressToBytes32 = exports.stringToBytes = exports.stringToBytes32 = exports.padRight = exports.padLeft = exports.numberToBytes32 = exports.sleep = exports.initWeb3Lib = void 0;
const bignumber_js_1 = require("bignumber.js");
const constants_1 = require("./constants");
const wallet_1 = require("./wallet");
let Web3 = initWeb3Lib();
function initWeb3Lib() {
    if (typeof window !== "undefined") {
        Web3 = window["Web3"];
        return window["Web3"];
    }
    else {
        let { Web3 } = require("./web3");
        return Web3;
    }
    ;
}
exports.initWeb3Lib = initWeb3Lib;
;
function sleep(millisecond) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(null);
        }, millisecond);
    });
}
exports.sleep = sleep;
;
function numberToBytes32(value, prefix) {
    let v = new bignumber_js_1.BigNumber(value).toString(16);
    v = v.replace("0x", "");
    v = padLeft(v, 64);
    if (prefix)
        v = '0x' + v;
    return v;
}
exports.numberToBytes32 = numberToBytes32;
function padLeft(string, chars, sign) {
    return new Array(chars - string.length + 1).join(sign ? sign : "0") + string;
}
exports.padLeft = padLeft;
function padRight(string, chars, sign) {
    return string + new Array(chars - string.length + 1).join(sign ? sign : "0");
}
exports.padRight = padRight;
function stringToBytes32(value) {
    if (Array.isArray(value)) {
        let result = [];
        for (let i = 0; i < value.length; i++) {
            result.push(stringToBytes32(value[i]));
        }
        return result;
    }
    else {
        if (value.length == 66 && value.startsWith('0x'))
            return value;
        return Web3.utils.padRight(Web3.utils.asciiToHex(value), 64);
    }
}
exports.stringToBytes32 = stringToBytes32;
function stringToBytes(value, nByte) {
    if (Array.isArray(value)) {
        let result = [];
        for (let i = 0; i < value.length; i++) {
            result.push(stringToBytes(value[i]));
        }
        return result;
    }
    else {
        if (nByte) {
            if (new RegExp(`^0x[0-9a-fA-F]{${2 * nByte}}$`).test(value))
                return value;
            else if (/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(value)) {
                if (value.length >= ((nByte * 2) + 2))
                    return value;
                else
                    return "0x" + value.substring(2) + "00".repeat(nByte - ((value.length - 2) / 2));
            }
            else if (/^([0-9a-fA-F][0-9a-fA-F])+$/.test(value)) {
                if (value.length >= (nByte * 2))
                    return value;
                else
                    return "0x" + value + "00".repeat(nByte - (value.length / 2));
            }
            else
                return Web3.utils.padRight(Web3.utils.asciiToHex(value), nByte * 2);
        }
        else {
            if (/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(value))
                return value;
            else if (/^([0-9a-fA-F][0-9a-fA-F])+$/.test(value))
                return "0x" + value;
            else
                return Web3.utils.asciiToHex(value);
        }
    }
}
exports.stringToBytes = stringToBytes;
function addressToBytes32(value, prefix) {
    let v = value;
    v = v.replace("0x", "");
    v = padLeft(v, 64);
    if (prefix)
        v = '0x' + v;
    return v;
}
exports.addressToBytes32 = addressToBytes32;
function bytes32ToAddress(value) {
    return '0x' + value.replace('0x000000000000000000000000', '');
}
exports.bytes32ToAddress = bytes32ToAddress;
function bytes32ToString(value) {
    return Web3.utils.hexToUtf8(value);
}
exports.bytes32ToString = bytes32ToString;
function addressToBytes32Right(value, prefix) {
    let v = value;
    v = v.replace("0x", "");
    v = padRight(v, 64);
    if (prefix)
        v = '0x' + v;
    return v;
}
exports.addressToBytes32Right = addressToBytes32Right;
function toNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    else if (typeof value === 'string') {
        return new bignumber_js_1.BigNumber(value).toNumber();
    }
    else if (typeof value === "bigint") {
        return Number(value);
    }
    else {
        return value.toNumber();
    }
}
exports.toNumber = toNumber;
function toDecimals(value, decimals) {
    decimals = decimals || 18;
    return new bignumber_js_1.BigNumber(value).shiftedBy(decimals);
}
exports.toDecimals = toDecimals;
function fromDecimals(value, decimals) {
    decimals = decimals || 18;
    return new bignumber_js_1.BigNumber(value).shiftedBy(-decimals);
}
exports.fromDecimals = fromDecimals;
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
exports.nullAddress = "0x0000000000000000000000000000000000000000";
function constructTypedMessageData(domain, customTypes, primaryType, message) {
    let data = {
        types: Object.assign({ EIP712Domain: constants_1.EIP712DomainAbi }, customTypes),
        primaryType: primaryType,
        domain: domain,
        message: message
    };
    return data;
}
exports.constructTypedMessageData = constructTypedMessageData;
function soliditySha3(...val) {
    return Web3.utils.soliditySha3(...val);
}
exports.soliditySha3 = soliditySha3;
function toChecksumAddress(address) {
    return Web3.utils.toChecksumAddress(address);
}
exports.toChecksumAddress = toChecksumAddress;
function registerSendTxEvents(sendTxEventHandlers) {
    const wallet = wallet_1.Wallet.getClientInstance();
    wallet.registerSendTxEvents({
        transactionHash: (error, receipt) => {
            if (sendTxEventHandlers.transactionHash) {
                sendTxEventHandlers.transactionHash(error, receipt);
            }
        },
        confirmation: (receipt) => {
            if (sendTxEventHandlers.confirmation) {
                sendTxEventHandlers.confirmation(receipt);
            }
        },
    });
}
exports.registerSendTxEvents = registerSendTxEvents;
function uint8ArrayToHex(byteArray) {
    let ret = '';
    byteArray.forEach(e => { ret += e.toString(16).padStart(2, "0"); });
    return ret;
}
exports.uint8ArrayToHex = uint8ArrayToHex;
function stringToUnicodeHex(str) {
    return str.split('').map(e => e.codePointAt(0).toString(16).padStart(2, "0")).join('');
}
exports.stringToUnicodeHex = stringToUnicodeHex;
function hexToString(hex) {
    let ret = '';
    for (let i = 0; i < hex.length; i += 2) {
        ret += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    }
    return ret;
}
exports.hexToString = hexToString;
