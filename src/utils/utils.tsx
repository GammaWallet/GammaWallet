const ethers = require("ethers")


const TruncatedText = (text:string,maxLength:number) => {
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  return <div>{truncatedText}</div>;
};

const isValidNumber = (input:any) => {
  return !isNaN(parseFloat(input)) && isFinite(input);
}

const openLinkInBrowser = (link:string) => {
  chrome.runtime.sendMessage({ action: "openLink", link: link});
};

const roundKPlaces = (num:number,k:number) => {
  try {
    return Number(num).toFixed(k) 
  } catch {
    return num
  }

}

function isValidEthereumAddress(address:string) {
  const addressRegex = /^0x[0-9a-fA-F]{40}$/;
  return addressRegex.test(address);
}

function roundToDecimalPlaces(number:number, decimalPlaces:number) {
  const factor = 10 ** decimalPlaces;
  return Math.floor(number * factor) / factor;
}

const isMnemonicValid = (mnemonic:string) : boolean => {
  try {
      ethers.utils.HDNode.fromMnemonic(mnemonic);
      return true;
  } catch (error) {
      return false;
  }
  return false
}


export default {
    TruncatedText,
    isValidNumber,
    openLinkInBrowser,
    roundKPlaces,
    roundToDecimalPlaces,
    isValidEthereumAddress,
    isMnemonicValid
}