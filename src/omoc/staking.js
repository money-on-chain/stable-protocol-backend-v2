import { sendTransaction } from '../transaction.js'


const StakingAllowance = async (web3, dContracts, allow) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const tg = dContracts.contracts.tg

  let amountAllowance = '0'
  const valueToSend = null
  if (allow) {
    amountAllowance = Number.MAX_SAFE_INTEGER.toString()
  }

  // Calculate estimate gas cost
  const estimateGas = await tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = tg.methods
    .approve(dContracts.contracts.mocvendors._address, web3.utils.toWei(amountAllowance))
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, tg._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const vestingVerify = async (web3, dContracts) => {
  /* Mark contract as verified by holder */
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const ivestingmachine = dContracts.contracts.ivestingmachine

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await ivestingmachine.methods
    .verify()
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = ivestingmachine.methods
    .verify()
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, ivestingmachine._address)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  StakingAllowance,
  vestingVerify
}
