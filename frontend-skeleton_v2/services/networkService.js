import { getExchangeContract, getTokenContract } from "./web3Service";
import EnvConfig from "../configs/env";
export function getSwapABI(data) {
  /*TODO: Get Swap ABI*/
}

export function getTransferABI(data) {
  /*TODO: Get Transfer ABI*/
  
}

export function getApproveABI(srcTokenAddress, amount) {
  /*TODO: Get Approve ABI*/
  
}

export function getAllowance(srcTokenAddress, address, spender) {
  /*TODO: Get current allowance for a token in user wallet*/
  let tokenContract = new web3.eth.Contract(EnvConfig.TOKEN_ABI,srcTokenAddress);
  return new Promise((resolve, reject) => {
    tokenContract.methods.allowance(address,spender).call().then((result) => {
      resolve(result)
    }, (error) => {
      reject(error);
    })
  })
}

/* Get Exchange Rate from Smart Contract */
export function getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount) {  
  //if (srcTokenAddress == EnvConfig.TOKENS[0].address && destTokenAddress == EnvConfig.TOKENS[0].address) return 1;
  const exchangeContract = getExchangeContract();  
  return new Promise((resolve, reject) => {
    //exchangeContract.methods.getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount).call().then((result) => {
    exchangeContract.methods.getExchangeAmount(srcTokenAddress, destTokenAddress, srcAmount).call().then((result) => {
      resolve(result/ Math.pow(10,18))
    }, (error) => {      
      reject(error);
      
    })
  })
}
//** i gonna fix this  */
// export function getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount) {
//   let exchangeContract = new web3.eth.Contract(EnvConfig.EXCHANGE_CONTRACT_ABI,EnvConfig.EXCHANGE_CONTRACT_ADDRESS);

//   return new Promise((resolve, reject) => {
//     exchangeContract.methods.getExchangeAmount(srcTokenAddress, destTokenAddress, srcAmount).call().then((result) => {
//       resolve(result)
//     }, (error) => {
//       reject(error);
//     })
//   })
// }

export async function getTokenBalances(tokens, address) {
  /*TODO: Get Token Balance*/
  //const tokenContract = getTokenContract(tokens);
  let tokenContract = new web3.eth.Contract(EnvConfig.TOKEN_ABI,tokens);
  return new Promise((resolve, reject) => {
    tokenContract.methods.balanceOf(address).call().then((result) => {
      resolve(result)
    }, (error) => {
      reject(error);
    })
  })
}
