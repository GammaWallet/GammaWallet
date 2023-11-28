export interface IToken {
    address:string,
    decimals:number,
    name:string,
    symbol:string,
}

export interface IUserAccount {
    address:string,
    privateKey:string,
    tokens : Array<IToken>
}

export interface IUserSettings {
    gasPriceMultiplier : number,
    lastUsedAccount : IUserAccount,

}

export interface IGammaData {
    userId : string,
    userAccounts : Array<IUserAccount>,
    userMnemonic : string,
    userSettings : IUserSettings
}


async function getGammaData() {
    let res = await chrome.storage.sync.get(['gammaVault'])
    if(res.gammaVault) {
        return JSON.parse(res.gammaVault)
    }
    return undefined
    
}

async function setGammaData(data:object) {
    let value = JSON.stringify(data)
    await chrome.storage.sync.set({gammaVault:value})
}

async function clearGammaData() {
    await chrome.storage.sync.clear();
}

async function addAccount(address:string,privateKey:string) {
    let gammaData : IGammaData = await getGammaData()
    let newAccount : IUserAccount = {
        address:address,
        privateKey:privateKey,
        tokens: []
    }
    gammaData.userAccounts.push(newAccount)
    await setGammaData(gammaData)

}

async function addToken(address:string,tokenAddress:string){

}


export default {
    getGammaData,
    setGammaData,
    clearGammaData,
    addAccount
}
