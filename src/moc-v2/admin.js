import { statusFromContracts } from './contracts.js'
import BigNumber from 'bignumber.js'
import { sendTransaction } from '../transaction.js'

const SettlementExecute = async (web3, dContracts, configProject) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  const Moc = dContracts.contracts.Moc
  const MocAddress = Moc.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get if block to settlement > 0 to continue
  const getBts = new BigNumber(dataContractStatus.getBts)
  if (getBts.lte(0)) throw new Error('Not time to execute settlement')

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await Moc.methods
    .execSettlement()
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = Moc.methods
    .execSettlement()
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const TCHoldersInterestPayment = async (web3, dContracts, configProject) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const Moc = dContracts.contracts.Moc
  const MocAddress = Moc.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get if block to settlement > 0 to continue
  const nextTCInterestPayment = new BigNumber(dataContractStatus.nextTCInterestPayment)
  if (new BigNumber(dataContractStatus.blockHeight).lte(nextTCInterestPayment)) throw new Error('Not time to execute Interest Payment')

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await Moc.methods
    .tcHoldersInterestPayment()
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = Moc.methods
    .tcHoldersInterestPayment()
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const UpdateEma = async (web3, dContracts, configProject) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const Moc = dContracts.contracts.Moc
  const MocAddress = Moc.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // shouldCalculateEma ?
  if (!dataContractStatus.shouldCalculateEma) throw new Error('Not time to update EMA')

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await Moc.methods
    .updateEmas()
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = Moc.methods
    .updateEmas()
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const VendorsGuardianSetMarkup = async (web3, dContracts, configProject, vendorAddress, vendorMarkup) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const MocVendors = dContracts.contracts.MocVendors
  const MocVendorsAddress = MocVendors.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // You are vendors guardian?
  if (vendorAddress.toLowerCase() !== dataContractStatus.vendorGuardianAddress.toLowerCase()) throw new Error('You are not Vendor guardian address')

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await MocVendors.methods
    .setVendorMarkup(vendorAddress, vendorMarkup)
    .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = MocVendors.methods
    .setVendorMarkup(vendorAddress, vendorMarkup)
    .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, MocVendorsAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const QueueExecute = async (web3, dContracts, configProject, feeRecipient) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()

  const MocQueue = dContracts.contracts.MocQueue
  const MocQueueAddress = MocQueue.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  const readyToExecute = await MocQueue.methods.readyToExecute().call()
  if (!readyToExecute) throw new Error('Is not ready to execute the queue!')

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await MocQueue.methods
      .execute(feeRecipient)
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = MocQueue.methods
      .execute(feeRecipient)
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      valueToSend,
      estimateGas,
      encodedCall,
      MocQueueAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}


export {
  SettlementExecute,
  UpdateEma,
  VendorsGuardianSetMarkup,
  TCHoldersInterestPayment,
  QueueExecute
}
