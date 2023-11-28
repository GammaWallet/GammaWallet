import { BigNumber } from "ethers"
import { ETH_PROVIDER } from "./constants"
import { providers } from "./constants"
import { IToken, IUserAccount } from "./userAccount"
const ethers = require("ethers")
const ERC20_ABI = require("./abis/ERC20.json")


export const getAccountBalance = async (address:string) => {
    const walletBalanceEth = await providers.eth.getBalance(address)
    const balanceEth = ethers.utils.formatEther(walletBalanceEth)
    return balanceEth
}

export const getDecimals = async (contractAddress:string) => {
    const contract = new ethers.Contract(contractAddress,ERC20_ABI,providers.eth)
    const decimals = await contract.decimals()
    return decimals
}


export const isValidTokenAddress = async (address:string) => {

    try {
        const erc20Interface = new ethers.utils.Interface([
            'function name() view returns (string)',
            'function symbol() view returns (string)'
          ]);    
        const contract = new ethers.Contract(address, erc20Interface, providers.eth);
    
        const [name, symbol] = await Promise.all([
            contract.name(),
            contract.symbol()
            ]);
        //console.log(name,symbol)
        if (name && symbol) {
            return true;
        }
        return false
    } catch {
        return false
    }

}

export const getTokenToAddData = async (address:string) => {
    let decimals = await getDecimals(address)
    const erc20Interface = new ethers.utils.Interface([
        'function name() view returns (string)',
        'function symbol() view returns (string)'
      ]);    
    const contract = new ethers.Contract(address, erc20Interface, providers.eth);

    const [name, symbol] = await Promise.all([
        contract.name(),
        contract.symbol()
        ]);
    let tokenToAdd : IToken = {
        address:address,
        name:name,
        symbol:symbol,
        decimals:decimals
    }
    return tokenToAdd

}


export const getTokenBalance = async(userAddress:string | undefined,tokenAddress:string | undefined) => {
    const tokenContract = new ethers.Contract(tokenAddress,['function balanceOf(address) view returns (uint256)'], providers.eth)
    const balance = await tokenContract.balanceOf(userAddress);
    return balance
}

const transferEth = async(to:string,amount:number,privateKey:string) => {
    const wallet = new ethers.Wallet(privateKey,providers.eth);
    const transactionResponse = await wallet.sendTransaction({
        to: to,
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit:21000,
    });
    return {sucess:true,res:transactionResponse.hash}
}

const transferEthWithGasPrice = async(to:string,amount:number,privateKey:string,gasPrice:BigNumber) => {
    const wallet = new ethers.Wallet(privateKey,providers.eth);
    const transactionResponse = await wallet.sendTransaction({
        to: to,
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit:21000,
        gasPrice:gasPrice
    });
    return {sucess:true,res:transactionResponse.hash}
}

const maxSendableEth = async(privateKey:string) => {
    const wallet = new ethers.Wallet(privateKey, providers.eth); 
    const gasPrice = await providers.eth.getGasPrice();
    const gasLimit = 21000;
    const balance = await wallet.getBalance(); 
    const totalEth = balance;
    const totalGasFees = gasPrice.mul(gasLimit).mul(15).div(10);
    const res = totalEth.sub(totalGasFees)
    const maxSendableEth =  ethers.utils.formatEther(res)
    return {maxSendableEth: maxSendableEth >= 0 ? maxSendableEth : 0,gasPrice:gasPrice}
}

const infiniteApprove = async(currUserAccount:IUserAccount,tokenAddress:string,routerAddress:string,nonce:number) => {
    //console.log("infinite approving")
    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth); 
    const tokenContract = new ethers.Contract(tokenAddress, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
    const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
    let decimals = await getDecimals(tokenAddress)
    const infiniteAllowance = ethers.constants.MaxUint256;
    //console.log(allowance)
    if(allowance.lt(infiniteAllowance)) {
        const approveTx = await tokenContract.approve(routerAddress, infiniteAllowance,{nonce});
        const approveReceipt = await approveTx.wait(); // Wait for the approval transaction to be mined
        const approveTxHash = approveReceipt.transactionHash;
        //console.log("Approve tx",approveTxHash)
    }
}

const infiniteApproveWithoutNonce = async(currUserAccount:IUserAccount,tokenAddress:string,routerAddress:string) => {
    //console.log("infinite approving")
    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth); 
    const tokenContract = new ethers.Contract(tokenAddress, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
    const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
    let decimals = await getDecimals(tokenAddress)
    const infiniteAllowance = ethers.constants.MaxUint256;
    //console.log(allowance)
    if(allowance.lt(infiniteAllowance)) {
        const approveTx = await tokenContract.approve(routerAddress, infiniteAllowance);
        const approveReceipt = await approveTx.wait(); // Wait for the approval transaction to be mined
        const approveTxHash = approveReceipt.transactionHash;
        return {success:true,res:approveTxHash}
    }
    return {success:false,res:""}
}


const checkIfApproveNeeded = async(currUserAccount:IUserAccount,tokenAddress:string,routerAddress:string,nonce:number) => {
    //console.log("infinite approving")
    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth); 
    const tokenContract = new ethers.Contract(tokenAddress, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
    const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
    let decimals = await getDecimals(tokenAddress)
    const infiniteAllowance = ethers.constants.MaxUint256;
    //console.log(allowance)
    return allowance.lt(infiniteAllowance)
}


const approveAfterSwap = async(txHash:string,currUserAccount:IUserAccount,tokenAddress:string,routerAddress:string,nonce:number) => {
    //console.log("infinite approving")
    const wallet = new ethers.Wallet(currUserAccount.privateKey,providers.eth); 
    const tokenContract = new ethers.Contract(tokenAddress, ['function allowance(address owner, address spender) view returns (uint256)','function approve(address spender, uint256 amount) public returns (bool)'], wallet);
    const allowance = await tokenContract.allowance(currUserAccount.address, routerAddress);
    let decimals = await getDecimals(tokenAddress)
    const infiniteAllowance = ethers.constants.MaxUint256;
    //console.log(allowance)
    if(allowance.lt(infiniteAllowance)) {

        const pollingInterval = 5000;
        const ts = Date.now()
        let receipt

        while (!receipt || receipt.confirmations === 0) {
          try {
            receipt = await providers.eth.getTransactionReceipt(txHash);
      
            if (receipt && receipt.confirmations > 0) {
              // Transaction mined
              //console.log('Transaction mined successfully');
              //console.log('Receipt:', receipt);
              
              const approveTx = await tokenContract.approve(routerAddress, infiniteAllowance);
              const approveReceipt = await approveTx.wait(); // Wait for the approval transaction to be mined
              const approveTxHash = approveReceipt.transactionHash;
              //console.log("Approve HASH : ",approveTxHash)

            } else {
              //console.log('Transaction not yet mined. Waiting for confirmation...');
            }
          } catch (error:any) {
            console.error('Error:', error.message);
          }
      
          // Wait for the next polling interval
          await new Promise((resolve) => setTimeout(resolve, pollingInterval));

          if(Date.now() - ts > 60000) break
        
        }


        ////console.log("Approve tx",approveTxHash)
    }
}



export default {
    getAccountBalance,
    isValidTokenAddress,
    getDecimals,
    transferEth,
    maxSendableEth,
    transferEthWithGasPrice,
    infiniteApprove,
    approveAfterSwap,
    checkIfApproveNeeded,
    infiniteApproveWithoutNonce
}