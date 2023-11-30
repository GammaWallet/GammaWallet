const ethers = require("ethers")

export let ETH_PROVIDER = "https://rpc.mevblocker.io"
export let FLASHBOTS_RPC = "https://rpc.mevblocker.io"

export const KYBERSWAP_AGGREGATOR_ADDRESS = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"
export const GAMMA_API_URL = "https://api.gammawallet.io/"

export const providers = {
    eth: ethers.getDefaultProvider(FLASHBOTS_RPC),
    flashbots : ethers.getDefaultProvider(FLASHBOTS_RPC)
};

