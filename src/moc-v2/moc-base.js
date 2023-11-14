import { sendTransaction } from '../transaction.js'
import { toContractPrecisionDecimals } from '../utils.js'
import BigNumber from 'bignumber.js'

const AllowanceUseWrapper = async (web3, dContracts, configProject, token, allow, tokenDecimals) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tokenAddress = token.options.address
  const collateral = configProject.collateral

  let contractAllowAddress
  if (collateral === 'bag') {
    contractAllowAddress = dContracts.contracts.MocCAWrapper.options.address
  } else {
    contractAllowAddress = dContracts.contracts.Moc.options.address
  }

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

export {
  AllowanceUseWrapper
}
