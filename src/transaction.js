import Web3 from 'web3'
import abiDecoder from 'abi-decoder'

import { toContractPrecision } from './utils.js'

const addABIOMoC = (dContracts) => {
  abiDecoder.addABI(dContracts.json.IRegistry.abi)
  abiDecoder.addABI(dContracts.json.StakingMachine.abi)
  abiDecoder.addABI(dContracts.json.DelayMachine.abi)
  abiDecoder.addABI(dContracts.json.Supporters.abi)
  abiDecoder.addABI(dContracts.json.VestingMachine.abi)
  abiDecoder.addABI(dContracts.json.VotingMachine.abi)
}

const addABIv2 = (dContracts) => {
  // Abi decoder
  abiDecoder.addABI(dContracts.json.TokenPegged.abi)
  abiDecoder.addABI(dContracts.json.CollateralToken.abi)
  abiDecoder.addABI(dContracts.json.Moc.abi)
  abiDecoder.addABI(dContracts.json.MocVendors.abi)
  abiDecoder.addABI(dContracts.json.MocQueue.abi)

}

const renderEventField = (eveName, eveValue) => {
  const formatItemsWei = new Set([
    'qTC_',
    'qAsset_',
    'qACfee_',
    'qAC_',
    'oldTPema_',
    'newTPema_',
    'qTP_',
    'TokenMigrated',
    'qFeeToken_',
    'qACVendorMarkup_',
    'qFeeTokenVendorMarkup_',
    'value'
  ])

  if (formatItemsWei.has(eveName)) { eveValue = Web3.utils.fromWei(eveValue) }

  console.log('\x1b[32m%s\x1b[0m', `${eveName}: ${eveValue}`)
}

const renderEvent = (evente) => {
  console.log('')
  console.log('\x1b[35m%s\x1b[0m', `Event: ${evente.name}`)
  console.log('')
  evente.events.forEach(eve => renderEventField(eve.name, eve.value))
}

const decodeEvents = (receipt) => {
  const decodedLogs = abiDecoder.decodeLogs(receipt.logs)

  const filterIncludes = [
    'Transfer',
    'Approval',
    'TCMinted',
    'TCRedeemed',
    'TPMinted',
    'TPRedeemed',
    'TPSwappedForTP',
    'TPSwappedForTC',
    'TCSwappedForTP',
    'TCandTPRedeemed',
    'TCandTPMinted',
    'PeggedTokenChange',
    'SuccessFeeDistributed',
    'TPemaUpdated',
    'BeaconUpgraded',
    'ContractLiquidated',
    'Paused',
    'PeggedTokenChange',
    'SettlementExecuted',
    'SuccessFeeDistributed',
    'TCInterestPayment',
    'AssetModified',
    'VendorMarkupChanged',
    'OperationError',
    'UnhandledError',
    'OperationQueued',
    'OperationExecuted',
    'LiqTPRedeemed',
    'PeggedTokenChange',
    'PaymentCancel',
    'PaymentDeposit',
    //'PaymentWithdraw',
    'PayEarnings',
    'CancelEarnings',
    'AddStake',
    //'WithdrawStake',
    //'Withdraw'
  ]

  const filteredEvents = decodedLogs.filter(event =>
    filterIncludes.includes(event.name)
  )

  filteredEvents.forEach(evente => renderEvent(evente))

  return filteredEvents
}

const sendTransaction = async (web3, value, estimateGas, encodedCall, toContract) => {
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const privateKey = process.env.USER_PK
  const gasMultiplier = process.env.GAS_MULTIPLIER

  console.log('Please wait... sending transaction... Wait until blockchain mine transaction!')

  let valueToSend
  if ((typeof value === 'undefined') || value === null) {
    valueToSend = '0x'
  } else {
    valueToSend = toContractPrecision(value)
  }

  // Get gas price from node
  const gasPrice = await web3.eth.getGasPrice()

  // Sign transaction need it PK
  const transaction = await web3.eth.accounts.signTransaction(
    {
      from: userAddress,
      to: toContract,
      value: valueToSend,
      gas: estimateGas * gasMultiplier,
      gasPrice,
      gasLimit: estimateGas * gasMultiplier,
      data: encodedCall
    },
    privateKey
  )

  // Send transaction and get receipt
  const receipt = await web3.eth.sendSignedTransaction(
    transaction.rawTransaction
  )

  // Print decode events
  const filteredEvents = decodeEvents(receipt)

  return { receipt, filteredEvents }
}

export {
  sendTransaction,
  addABIOMoC,
  addABIv2
}
