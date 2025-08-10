export const EIP712DomainAbi = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
]

export const TYPED_MESSAGE_SCHEMA = {
    type: 'object',
    properties: {
        types: {
            type: 'object',
            additionalProperties: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                    },
                    required: ['name', 'type'],
                },
            },
        },
        primaryType: { type: 'string' },
        domain: { type: 'object' },
        message: { type: 'object' },
    },
    required: ['types', 'primaryType', 'domain', 'message'],
};

export enum ClientWalletEvent {
    AccountsChanged = "accountsChanged",
    ChainChanged = "chainChanged",
    Connect = "connect",
    Disconnect = "disconnect"
}

export enum RpcWalletEvent {
    Connected = "connected",
    Disconnected = "disconnected",
    ChainChanged = "chainChanged"
}