import { GAMMA_API_URL } from "./constants";
import userAccount, { IUserAccount } from "./userAccount";
const ethers = require("ethers")
import { providers } from "./constants";
const ERC20_ABI =  require("./abis/ERC20.json")


export type IWalletTokenBalances = ITokenBalance[]

export interface ITokenBalance {
  tokenName: string
  tokenSymbol: string
  tokenLogo: any
  tokenDecimals: string
  nativePrice: NativePrice
  usdPrice: number
  usdPriceFormatted: string
  exchangeAddress: string
  exchangeName: string
  tokenAddress: string
  token_address: string
  symbol: string
  name: string
  logo: any
  thumbnail: any
  decimals: number
  balance: string
  possible_spam: boolean
}

export interface NativePrice {
  value: string
  decimals: number
  name: string
  symbol: string
  address: string
}

export const getDecimals = async (contractAddress:string) => {
    const contract = new ethers.Contract(contractAddress,ERC20_ABI,providers.eth)
    const decimals = await contract.decimals()
    return decimals
}


export const getWalletTokenBalances = async (address:string | undefined) => {

    let url = GAMMA_API_URL + "get_wallet_token_balances?address="+address

    const res = await fetch(url, {
        "body": null,
        "method": "GET"
    });

    let data = await res.json()
    return data
}

export const getKyberRoute  = async (from:string,to:string,amount:number) => {
    let url = GAMMA_API_URL + "get_kyber_route?from="+from+"&to="+to+"&amount="+amount.toString()

    const res = await fetch(url,{
        "body":null,
        "method":"GET"
    });
    
    let data = await res.json()
    return data
}


export const buildRoute  = async (from:string,to:string,amount:number,maxSlippage:number,userAddress:string) => {
    let url = GAMMA_API_URL + "build_kyber_route?from="+from+"&to="+to+"&amount="+amount.toString()+"&maxSlippage="+maxSlippage.toString()+"&userAddress="+userAddress

    const res = await fetch(url,{
        "body":null,
        "method":"GET"
    });
    
    let data = await res.json()
    return data
}

export const buildRouteAndBuy = async (from:string,to:string,amount:number,currUserAccount:IUserAccount,maxSlippage:number,mevProtect:boolean | undefined) => {
    let res = await buildRoute(from,to,amount,maxSlippage,currUserAccount.address)
    if(!res.success) {
        return {success:false,res:"Unable to send request to kyberswap"}
    }

    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth);

    const data = res.res
    let routerAddress = data.data.routerAddress
    let txData = data.data.data
    let gasLimit = data.data.gas

    //console.log(data)

    let value = 0
    if(from == "eth") {
        value = ethers.utils.parseEther(amount.toString())
    }

    let userGammaData = await userAccount.getGammaData()
    let gasMultiplier = userGammaData.userSettings.gasPriceMultiplier
    gasMultiplier = Math.round(100 * gasMultiplier) 
    const nonce = await providers.eth.getTransactionCount(currUserAccount.address);

    let currentGasPrice = await providers.eth.getGasPrice();

    let tx = {
        to:routerAddress,
        data:txData,
        value:value,
        gasPrice:currentGasPrice.mul(gasMultiplier).div(100),
        chainId : 1,
        nonce:nonce
    }


    if(to == "eth") {
        const tokenContract = new ethers.Contract(from, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
        const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
        let decimals = await getDecimals(from)
        let amountIn = ethers.utils.parseUnits(amount.toString(),decimals)
        const infiniteAllowance = ethers.constants.MaxUint256;
        if(allowance.lt(infiniteAllowance)) {
            const approveTx = await tokenContract.approve(routerAddress, infiniteAllowance);
            const approveReceipt = await approveTx.wait(); // Wait for the approval transaction to be mined
            const approveTxHash = approveReceipt.transactionHash;
            //console.log("Approve tx",approveTxHash)
        }
    }


    let swapRes = {success:false,res:""}

    if(mevProtect) {
        let wallet = new ethers.Wallet(currUserAccount.privateKey,providers.flashbots)
        const txResp = await wallet.sendTransaction(tx)
        //console.log("Transaction hash:",txResp.hash)
        swapRes.success = true
        swapRes.res = txResp.hash
    } else {
        const txResp = await wallet.sendTransaction(tx)
        //console.log("Transaction hash:",txResp.hash)
        swapRes.success = true
        swapRes.res = txResp.hash
    }
    
    if(from == "eth" && swapRes.res) {
        let newNonce = nonce+1;
        chrome.runtime.sendMessage({
            action : 'infiniteApprove',
            currUserAccount:currUserAccount,
            tokenAddress:to,
            routerAddress:routerAddress,
            nonce:newNonce,
            txHash:swapRes.res

        })
    }

    return swapRes

}


export const buildRouteAndSimulate = async (from:string,to:string,amount:number,currUserAccount:IUserAccount,maxSlippage:number,mevProtect:boolean | undefined) => {

    try {

    let res = await buildRoute(from,to,amount,maxSlippage,currUserAccount.address)
    if(!res.success) {
        return {success:false,res:"Unable to send request to kyberswap"}
    }

    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth);

    const data = res.res
    let routerAddress = data.data.routerAddress
    let txData = data.data.data
    let gasLimit = data.data.gas

    //console.log(data)

    let value = 0
    if(from == "eth") {
        value = ethers.utils.parseEther(amount.toString())
    }

    let userGammaData = await userAccount.getGammaData()
    let gasMultiplier = userGammaData.userSettings.gasPriceMultiplier
    gasMultiplier = Math.round(100 * gasMultiplier) 
    const nonce = await providers.eth.getTransactionCount(currUserAccount.address);

    let currentGasPrice = await providers.eth.getGasPrice();

    let tx = {
        to:routerAddress,
        data:txData,
        value:value,
        gasPrice:currentGasPrice.mul(gasMultiplier).div(100),
        chainId : 1,
        nonce:nonce
    }


    if(to == "eth") {
        const tokenContract = new ethers.Contract(from, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
        const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
        let decimals = await getDecimals(from)
        let amountIn = ethers.utils.parseUnits(amount.toString(),decimals)
        const infiniteAllowance = ethers.constants.MaxUint256;
        if(allowance.lt(infiniteAllowance)) {
            const approveTx = await tokenContract.approve(routerAddress, infiniteAllowance);
            const approveReceipt = await approveTx.wait(); // Wait for the approval transaction to be mined
            const approveTxHash = approveReceipt.transactionHash;
            //console.log("Approve tx",approveTxHash)
        }
    }


    let swapRes = {success:false,res:""}

    if(mevProtect) {
        let wallet = new ethers.Wallet(currUserAccount.privateKey,providers.flashbots)
        const txResp = await wallet.estimateGas(tx)
    } else {
        const txResp = await wallet.estimateGas(tx)
    }

    return true 
} catch {
    return false
}

}

export const findOptimalSlippage = async (from:string,to:string,amount:number,currUserAccount:IUserAccount,maxSlippage:number,mevProtect:boolean | undefined) => {
    
    /*
    let l = 0.5
    let r = 20
    let res = 0.5
    while ( l <= r) {
        let mid = Math.round(((l+r)/2)*100)
        //console.log(mid)
        let curr = await buildAndSimulate(from,to,amount,currUserAccount,mid,mevProtect)
        if(curr) {
            res = mid/100
            r = mid/100 - 1
        } else {
            l = mid/100 + 1
        }
    }
    */

    
    
    let res = 0.5
    for(let i = 0.5;i < 100;i+=5) {
        let curr = await buildRouteAndSimulate(from,to,amount,currUserAccount,i*100,mevProtect)
        if(curr) return i
    }
    
    

    return res

}

export const getTokenValue = async (tokenAddress:string,amount:number) => {
    let url = GAMMA_API_URL + "get_token_value?tokenAddress="+tokenAddress+"&amount="+amount
    const res = await fetch(url, {
        "body": null,
        "method": "GET"
    });

    let data = await res.json()
    return {success:true,res:data}
}