import onchain from "./utils/onchain";
import { IUserAccount } from "./utils/userAccount";

const delayedInfiniteApprove = async(txHash:string,currUserAccount:IUserAccount,tokenAddress:string,routerAddress:string,nonce:number) => {
  //console.log("approving in background")
  onchain.approveAfterSwap(txHash,currUserAccount,tokenAddress,routerAddress,nonce)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openLink") {
      chrome.tabs.create({ url: message.link });
    }

    if(message.action === "infiniteApprove") {
      //console.log("in background")
      const currUserAccount:IUserAccount = message.currUserAccount
      const tokenAddress:string = message.tokenAddress
      const routerAddress:string = message.routerAddress
      const nonce:number = message.nonce
      const txHash:string = message.txHash
      //console.log(currUserAccount)
      //console.log(tokenAddress)
      //console.log(routerAddress)
      //console.log(nonce)
      //console.log(txHash)
      delayedInfiniteApprove(txHash,currUserAccount,tokenAddress,routerAddress,nonce,)
    }

  });

export {};


