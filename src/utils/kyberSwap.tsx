const ethers = require("ethers")
import { providers } from "./constants";

const ERC20_ABI =  require("./abis/ERC20.json")
import { BigNumber } from "ethers";
import userAccount, { IUserAccount } from "./userAccount";
import onchain from "./onchain";
import utils from "./utils";


export const getDecimals = async (contractAddress:string) => {
    const contract = new ethers.Contract(contractAddress,ERC20_ABI,providers.eth)
    const decimals = await contract.decimals()
    return decimals
}


export const getKyberRoute = async (from:string,to:string,amount:number) => {

    let tokenIn = ""
    let tokenOut = ""
    let amountIn


    if(from == "eth") {
        tokenIn = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        tokenOut = to
        amountIn = (ethers.utils.parseEther(amount.toString())).toString()

    } else {
        tokenIn = from
        tokenOut = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        let decimals = await getDecimals(from)
        amountIn = ethers.utils.parseUnits(amount.toString(),decimals)
    } 


    const res = await fetch(`https://aggregator-api.kyberswap.com/ethereum/api/v1/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&saveGas=false&gasInclude=false`, {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "Referer": "https://kyberswap.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
      });

     if(!res.ok) {
        return {success:false,res:"Request to kyberswap failed"}
     }

     const data = await res.json()
     return {success:true,res:data}

      
}



export const buildRouteAndBuy = async (from:string,to:string,amount:number,currUserAccount:IUserAccount,maxSlippage:number,mevProtect:boolean | undefined) => {
    let route = await getKyberRoute(from,to,amount)

    if(!route.success) {
        return {success:false,res:"Unable to find route to buy token"}
    }

    

    let payload = {
        deadline: parseInt((Date.now()/1000).toString()) + 60*60,
        recipient: currUserAccount.address,
        routeSummary : route.res.data.routeSummary,
        sender : currUserAccount.address,
        skipSimulateTx : false,
        slippageTolerance : maxSlippage,
        source : "kyberswap"

    }

    //console.log("route",route)
    //console.log("payload",payload)

    const res = await fetch("https://aggregator-api.kyberswap.com/ethereum/api/v1/route/build", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/json",
            "sec-ch-ua": "\"Chromium\";v=\"118\", \"Google Chrome\";v=\"118\", \"Not=A?Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Linux\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-client-id": "kyberswap",
            "Referer": "https://kyberswap.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": JSON.stringify(payload),
        "method": "POST"
        });

    if(!res.ok) {
        return {success:false,res:"Unable to send request to kyberswap"}
    }


    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth);

    //console.log(wallet.address,"address")


    const data = await res.json()
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



export const buildAndSimulate = async (from:string,to:string,amount:number,currUserAccount:IUserAccount,maxSlippage:number,mevProtect:boolean | undefined) => {

        try {

        let route = await getKyberRoute(from,to,amount)

        if(!route.success) {
            return {success:false,res:"Unable to find route to buy token"}
        }

        let payload = {
            deadline: parseInt((Date.now()/1000).toString()) + 60*60,
            recipient: currUserAccount.address,
            routeSummary : route.res.data.routeSummary,
            sender : currUserAccount.address,
            skipSimulateTx : false,
            slippageTolerance : maxSlippage,
            source : "kyberswap"

        }

        //console.log("route",route)
        //console.log("payload",payload)

        const res = await fetch("https://aggregator-api.kyberswap.com/ethereum/api/v1/route/build", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "content-type": "application/json",
                "sec-ch-ua": "\"Chromium\";v=\"118\", \"Google Chrome\";v=\"118\", \"Not=A?Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "x-client-id": "kyberswap",
                "Referer": "https://kyberswap.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": JSON.stringify(payload),
            "method": "POST"
            });

        if(!res.ok) {
            return {success:false,res:"Unable to send request to kyberswap"}
        }


        const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth);

        //console.log(wallet.address,"address")


        const data = await res.json()
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

    /*
    let res = 0.5
    for(let i = 0.5;i < 100;i+=3) {
        let curr = await buildAndSimulate(from,to,amount,currUserAccount,i*100,mevProtect)
        if(curr) return i
    }
    */

    return res

}


export const getTokenValue = async (tokenAddress:string,amount:number) => {
    let route = await getKyberRoute(tokenAddress,"eth",amount)

    if(!route.success) {
        return {success:false}
    }

    let routeSummary = route.res.data.routeSummary
    return {success:true,res:routeSummary}
}
