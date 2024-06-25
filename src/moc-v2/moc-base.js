import { sendTransaction } from '../transaction.js'
import { toContractPrecisionDecimals } from '../utils.js'
import BigNumber from 'bignumber.js'

const AllowanceUse = async (web3, dContracts, configProject, token, allow, tokenDecimals) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tokenAddress = token.options.address

  let contractAllowAddress
  contractAllowAddress = dContracts.contracts.Moc.options.address

  let amountAllowance = new BigNumber('0')
  const valueToSend = null
  if (allow) {
    amountAllowance = new BigNumber(10000) // Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await token.methods
    .approve(contractAllowAddress, toContractPrecisionDecimals(amountAllowance, tokenDecimals))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = token.methods
    .approve(contractAllowAddress, toContractPrecisionDecimals(amountAllowance, tokenDecimals))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tokenAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const AllowanceUseContract = async (web3, dContracts, configProject, token, contract, amount, tokenDecimals) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tokenAddress = token.options.address
  const contractAllowAddress = contract.options.address

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await token.methods
      .approve(contractAllowAddress, toContractPrecisionDecimals(amount, tokenDecimals))
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = token.methods
      .approve(contractAllowAddress, toContractPrecisionDecimals(amount, tokenDecimals))
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tokenAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}


const refreshACBalance = async (web3, dContracts) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .refreshACBalance()
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = MoCContract.methods
      .refreshACBalance()
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const valueToSend = null
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MoCContractAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  AllowanceUse,
  refreshACBalance,
  AllowanceUseContract
}
