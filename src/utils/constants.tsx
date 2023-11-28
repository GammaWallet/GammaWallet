const ethers = require("ethers")

export let ETH_PROVIDER = "https://mainnet.infura.io/v3/c7bba2e1f2c24bcf9690125219d0f090"

export let FLASHBOTS_RPC = "https://rpc.mevblocker.io"

export const KYBERSWAP_AGGREGATOR_ADDRESS = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"

export const providers = {
    eth: ethers.getDefaultProvider(ETH_PROVIDER),
    flashbots : ethers.getDefaultProvider(FLASHBOTS_RPC)
};

