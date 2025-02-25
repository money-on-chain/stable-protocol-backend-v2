import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { statusFromContracts, userBalanceFromContracts } from './contracts.js'
import { toContractPrecision, fromContractPrecisionDecimals, toContractPrecisionDecimals } from '../utils.js'
import { sendTransaction } from '../transaction.js'

const mintTC = async (web3, dContracts, configProject, caIndex, qTC) => {
  // Mint Collateral token with CA support vendors

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.MINT_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TC
  let tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
  const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tcMintFee))

  // TC amount in CA
  if (!tcPrice.gt(0)) {
    tcPrice = new BigNumber(process.env.PRICE_TC)
  }

  const qCAtc = new BigNumber(qTC).times(tcPrice)

  // Fee
  const feeOperation = qCAtc.times(feeParam)

  // Fee Paying with Token
  const feeTokenPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_FeeToken))
  const feeTokenPct = new BigNumber(Web3.utils.fromWei(dataContractStatus.feeTokenPct))
  const qFeeToken = qCAtc.times(feeParam.times(feeTokenPct)).div(feeTokenPrice)

  // Markup Vendors
  const vendorMarkup = new BigNumber(Web3.utils.fromWei(dataContractStatus.vendorMarkup))
  const markOperation = qCAtc.times(vendorMarkup)
  const markOperationToken = qCAtc.times(vendorMarkup).div(feeTokenPrice)

  // Total fee token
  const totalFeeToken = qFeeToken.plus(markOperationToken)

  const feeTokenAllowance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.allowance, configProject.tokens.FeeToken.decimals))
  const feeTokenBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.balance, configProject.tokens.FeeToken.decimals))
  let qCAtcwFee
  if (feeTokenAllowance.gt(totalFeeToken) && feeTokenBalance.gt(totalFeeToken)) {
    // Pay fee with token
    qCAtcwFee = qCAtc
    console.log(`Commissions: ${totalFeeToken.toString()} ${configProject.tokens.FeeToken.name}`)
  } else {
    // Pay fee with CA
    qCAtcwFee = qCAtc.plus(feeOperation).plus(markOperation)
    console.log(`Commissions: ${feeOperation.plus(markOperation).toString()} ${configProject.tokens.CA[caIndex].name}`)
  }

  console.log(`Operation w/commissions: ${qCAtcwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Add Slippage plus %
  const qAssetMax = new BigNumber(slippage).div(100).times(qCAtcwFee).plus(qCAtcwFee)

  console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userReserveBalance)) throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`)

  // Allowance    reserveAllowance
  console.log(`Allowance: To mint ${qTC} ${configProject.tokens.TC.name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userSpendableBalance)) throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract')

  const valueToSend = dataContractStatus.tcMintExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .mintTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .mintTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemTC = async (web3, dContracts, configProject, caIndex, qTC) => {
  // Redeem Collateral token receiving CA support vendors

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TC in CA
  let tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
  const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tcRedeemFee))

  // TC amount in CA
  if (!tcPrice.gt(0)) {
    tcPrice = new BigNumber(process.env.PRICE_TC)
  }

  // TC amount in reserve
  const qCAtc = new BigNumber(qTC).times(tcPrice)

  // Fee
  const feeOperation = qCAtc.times(feeParam)

  // Fee Paying with Token
  const feeTokenPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_FeeToken))
  const feeTokenPct = new BigNumber(Web3.utils.fromWei(dataContractStatus.feeTokenPct))
  const qFeeToken = qCAtc.times(feeParam.times(feeTokenPct)).div(feeTokenPrice)

  // Markup Vendors
  const vendorMarkup = new BigNumber(Web3.utils.fromWei(dataContractStatus.vendorMarkup))
  const markOperation = qCAtc.times(vendorMarkup)
  const markOperationToken = qCAtc.times(vendorMarkup).div(feeTokenPrice)

  // Total fee token
  const totalFeeToken = qFeeToken.plus(markOperationToken)

  const feeTokenAllowance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.allowance, configProject.tokens.FeeToken.decimals))
  const feeTokenBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.balance, configProject.tokens.FeeToken.decimals))
  let qCAtcwFee
  if (feeTokenAllowance.gt(totalFeeToken) && feeTokenBalance.gt(totalFeeToken)) {
    // Pay fee with token
    qCAtcwFee = qCAtc
    console.log(`Commissions: ${totalFeeToken.toString()} ${configProject.tokens.FeeToken.name}`)
  } else {
    // Pay fee with CA
    qCAtcwFee = qCAtc.minus(feeOperation).minus(markOperation)
    console.log(`Commissions: ${feeOperation.minus(markOperation).toString()} ${configProject.tokens.CA[caIndex].name}`)
  }

  console.log(`Operation w/commissions: ${qCAtcwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Minimum AC to receive, or fail the tx
  const qAssetMin = new BigNumber(qCAtcwFee).minus(new BigNumber(slippage).div(100).times(qCAtcwFee))

  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Verifications

  // User have sufficient TC in balance?
  console.log(`Redeeming ${qTC} ${configProject.tokens.TC.name} ... getting approx: ${qCAtcwFee} ${configProject.tokens.CA[caIndex].name}... `)
  const userTCBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TC.balance,
    configProject.tokens.TC.decimals))
  if (new BigNumber(qTC).gt(userTCBalance)) { throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`) }

  // There are sufficient TC in the contracts to redeem?

  // Commented
  /*
  const tcAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTCAvailableToRedeem))
  if (new BigNumber(qTC).gt(tcAvailableToRedeem)) { throw new Error(`Insufficient ${configProject.tokens.TC.name}available to redeem in contract`) }
   */

  // There are sufficient CA in the contract
  const caBalance = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getACBalance[caIndex],
    configProject.tokens.CA[caIndex].decimals))
  if (new BigNumber(qCAtcwFee).gt(caBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} in the contract. Balance: ${caBalance} ${configProject.tokens.CA[caIndex].name}`) }

  // Send value of redeem exec fee
  const valueToSend = dataContractStatus.tcRedeemExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .redeemTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .redeemTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
    web3,
    new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
    estimateGas,
    encodedCall,
    MoCContractAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
  // Mint pegged token with collateral CA BAG support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.MINT_SLIPPAGE}`
  const tpAddress = dContracts.contracts.TP[tpIndex].options.address

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // get TP price from contract
  let tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
  const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tpMintFees[tpIndex]))

  if (!tpPrice.gt(0)) {
    tpPrice = new BigNumber(process.env.PRICE_TP[tpIndex])
  }

  // Pegged amount in CA
  const qCAtp = new BigNumber(qTP).div(tpPrice)

  // Fee
  const feeOperation = qCAtp.times(feeParam)

  // Fee Paying with Token
  const feeTokenPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_FeeToken))
  const feeTokenPct = new BigNumber(Web3.utils.fromWei(dataContractStatus.feeTokenPct))
  const qFeeToken = qCAtp.times(feeParam.times(feeTokenPct)).div(feeTokenPrice)

  // Markup Vendors
  const vendorMarkup = new BigNumber(Web3.utils.fromWei(dataContractStatus.vendorMarkup))
  const markOperation = qCAtp.times(vendorMarkup)
  const markOperationToken = qCAtp.times(vendorMarkup).div(feeTokenPrice)

  // Total fee token
  const totalFeeToken = qFeeToken.plus(markOperationToken)

  const feeTokenAllowance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.allowance, configProject.tokens.FeeToken.decimals))
  const feeTokenBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.balance, configProject.tokens.FeeToken.decimals))
  let qCAtpwFee
  if (feeTokenAllowance.gt(totalFeeToken) && feeTokenBalance.gt(totalFeeToken)) {
    // Pay fee with token
    qCAtpwFee = qCAtp
    console.log(`Commissions: ${totalFeeToken.toString()} ${configProject.tokens.FeeToken.name}`)
  } else {
    // Pay fee with CA
    qCAtpwFee = qCAtp.plus(feeOperation).plus(markOperation)
    console.log(`Commissions: ${feeOperation.plus(markOperation).toString()} ${configProject.tokens.CA[caIndex].name}`)
  }

  console.log(`Operation w/commissions: ${qCAtpwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Add Slippage plus %
  const qAssetMax = new BigNumber(slippage).div(100).times(qCAtpwFee).plus(qCAtpwFee)

  console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} `)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userReserveBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`) }

  // Allowance
  console.log(`Allowance: To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }

  // There are sufficient PEGGED in the contracts to mint?
  // COMMENTED temporally
  /*
  const tpAvailableToMint = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getTPAvailableToMint[tpIndex], configProject.tokens.TP[tpIndex].decimals))
  const qAssetAvailableToMint = new BigNumber(tpAvailableToMint).div(tpPrice)
  if (new BigNumber(qAssetMax).gt(qAssetAvailableToMint)) { throw new Error(`Insufficient ${configProject.tokens.TP.name} available to mint`) }
  */

  const valueToSend = dataContractStatus.tpMintExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .mintTP(
          tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .mintTP(
          tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
  // Redeem pegged token receiving CA support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`
  const tpAddress = dContracts.contracts.TP[tpIndex].options.address

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // get TP price from contract
  let tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
  const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tpRedeemFees[tpIndex]))

  if (!tpPrice.gt(0)) {
    const staticPrices = process.env.PRICE_TP.split(",")
    tpPrice = new BigNumber(staticPrices[tpIndex])
  }

  // TP amount in CA
  const qCAtp = new BigNumber(qTP).div(tpPrice)

  // Fee
  const feeOperation = qCAtp.times(feeParam)

  // Fee Paying with Token
  const feeTokenPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_FeeToken))
  const feeTokenPct = new BigNumber(Web3.utils.fromWei(dataContractStatus.feeTokenPct))
  const qFeeToken = qCAtp.times(feeParam.times(feeTokenPct)).div(feeTokenPrice)

  // Markup Vendors
  const vendorMarkup = new BigNumber(Web3.utils.fromWei(dataContractStatus.vendorMarkup))
  const markOperation = qCAtp.times(vendorMarkup)
  const markOperationToken = qCAtp.times(vendorMarkup).div(feeTokenPrice)

  // Total fee token
  const totalFeeToken = qFeeToken.plus(markOperationToken)

  const feeTokenAllowance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.allowance, configProject.tokens.FeeToken.decimals))
  const feeTokenBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.FeeToken.balance, configProject.tokens.FeeToken.decimals))
  let qCAtpwFee
  if (feeTokenAllowance.gt(totalFeeToken) && feeTokenBalance.gt(totalFeeToken)) {
    // Pay fee with token
    qCAtpwFee = qCAtp
    console.log(`Commissions: ${totalFeeToken.toString()} ${configProject.tokens.FeeToken.name}`)
  } else {
    // Pay fee with CA
    qCAtpwFee = qCAtp.minus(feeOperation).minus(markOperation)
    console.log(`Commissions: ${feeOperation.minus(markOperation).toString()} ${configProject.tokens.CA[caIndex].name}`)
  }

  console.log(`Operation w/commissions: ${qCAtpwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Minimum AC to receive, or fail the tx
  const qAssetMin = new BigNumber(qCAtpwFee).minus(new BigNumber(slippage).div(100).times(qCAtpwFee))

  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Verifications

  // User have sufficient PEGGED Token in balance?
  console.log(`Redeeming ${qTP} ${configProject.tokens.TP[tpIndex].name} ... getting approx: ${qCAtpwFee} ${configProject.tokens.CA[caIndex].name}... `)
  const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[tpIndex].balance, configProject.tokens.TP[tpIndex].decimals))
  if (new BigNumber(qTP).gt(userTPBalance)) { throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  user balance`) }

  /*
  // There are sufficient Free Pegged Token in the contracts to redeem?
  const tpAvailableToRedeem = new BigNumber(Web3.utils.fromWei(dataContractStatus.getTPAvailableToMint[tpIndex]))
  if (new BigNumber(qTP).gt(tpAvailableToRedeem)) { throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  available to redeem in contract`) }

  // There are sufficient CA in the contract
  const caBalance = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getACBalance[caIndex], configProject.tokens.CA[caIndex].decimals))
  if (new BigNumber(qCAtpwFee).gt(caBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} in the contract. Balance: ${caBalance} ${configProject.tokens.CA[caIndex].name}`) }

   */

  const valueToSend = dataContractStatus.tpRedeemExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .redeemTP(
          tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      )
      .estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .redeemTP(
          tpAddress,
          toContractPrecision(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecision(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      )
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const swapTPforTP = async (web3, dContracts, configProject, iFromTP, iToTP, qTP, caIndex) => {
  // caller sends a Pegged Token and receives another one support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // get reserve price from contract
  const tpPriceFrom = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[iFromTP]))
  const tpPriceTo = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[iToTP]))
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.swapTPforTPFee))

  const qCAtp_From = new BigNumber(qTP).div(tpPriceFrom)
  const qCAtp_To = qCAtp_From.times(tpPriceTo)

  const feeOperation = qCAtp_From.times(SwapFees)
  console.log(`Commissions: ${feeOperation.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // minimum amount of target Pegged Token that the sender expects to receive
  const qTPMin = new BigNumber(qCAtp_To).minus(new BigNumber(slippage).div(100).times(qCAtp_To))
  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qTPMin.toString()} ${configProject.tokens.TP[iToTP].name}`)

  // maximum amount of Asset that can be spent in fees
  const qAssetMaxFees = new BigNumber(slippage).div(100).times(qCAtp_From).plus(qCAtp_From).times(SwapFees)
  console.log(`Slippage using ${slippage} %. Maximum amount of asset can be spent in fees: ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} `)

  // Verifications

  // User have sufficient PEGGED Token in balance?
  console.log(`Swap ${qTP} ${configProject.tokens.TP[iFromTP].name} ... getting approx: ${qCAtp_To} ${configProject.tokens.TP[iToTP].name}... `)
  const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[iFromTP].balance, configProject.tokens.TP[iFromTP].decimals))
  if (new BigNumber(qTP).gt(userTPBalance)) { throw new Error(`Insufficient ${configProject.tokens.TP[iFromTP].name}  user balance`) }

  // Fees user have sufficient reserve to pay?
  console.log(`To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userReserveBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`) }

  // Fees Allowance
  console.log(`Allowance: To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }

  const valueToSend = dataContractStatus.swapTPforTPExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTPforTP(iFromTP,
          iToTP,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .swapTPforTP(iFromTP,
          iToTP,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      )
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const swapTPforTC = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
  // caller sends a Pegged Token and receives Collateral Token support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  const tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
  const tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.swapTPforTCFee))

  const qCAtp = new BigNumber(qTP).div(tpPrice)
  const qTC = new BigNumber(qCAtp).times(tcPrice)

  const feeOperation = qCAtp.times(SwapFees)
  console.log(`Commissions: ${feeOperation.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // minimum amount of target Pegged Token that the sender expects to receive
  const qTCMin = qTC.minus(new BigNumber(slippage).div(100).times(qTC))

  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qTCMin.toString()} ${configProject.tokens.TC.name}`)

  // maximum amount of Asset that can be spent in fees
  const qAssetMaxFees = new BigNumber(slippage).div(100).times(qCAtp).plus(qCAtp).times(SwapFees)

  console.log(`Slippage using ${slippage} %. Maximum amount of asset can be spent in fees: ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} `)

  // Redeem function... no values sent
  const valueToSend = dataContractStatus.swapTPforTCExecFee

  // Verifications

  // User have sufficient PEGGED Token in balance?
  console.log(`Swap ${qTP} ${configProject.tokens.TP[tpIndex].name} ... getting approx: ${qTC} ${configProject.tokens.TC.name}... `)
  const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[tpIndex].balance, configProject.tokens.TP[tpIndex].decimals))
  if (new BigNumber(qTP).gt(userTPBalance)) { throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  user balance`) }

  // Fees user have sufficient reserve to pay?
  console.log(`To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userReserveBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`) }

  // Fees Allowance
  console.log(`Allowance: To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTPforTC(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qTCMin, configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      )
      .estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .swapTPforTC(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qTCMin, configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      )
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const swapTCforTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTC) => {
  // caller sends Collateral Token and receives Pegged Token support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Prices
  const tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
  const tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.redeemTCandTPFee))

  // Conversions
  const qCAtc = new BigNumber(qTC).times(tcPrice)
  const qTP = new BigNumber(qCAtc).times(tpPrice)

  const feeOperation = qCAtc.times(SwapFees)
  console.log(`Commissions: ${feeOperation.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // minimum amount of Pegged Token that the sender expects to receive
  const qTPMin = qTP.minus(new BigNumber(slippage).div(100).times(qTP))

  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qTPMin.toString()} ${configProject.tokens.TP[tpIndex].name}`)

  // maximum amount of Asset that can be spent in fees
  const qAssetMaxFees = new BigNumber(slippage).div(100).times(qCAtc).plus(qCAtc).times(SwapFees)

  console.log(`Slippage using ${slippage} %. Maximum amount of asset can be spent in fees: ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} `)

  // Verifications

  // User have sufficient TC in balance?
  console.log(`Swap ${qTC} ${configProject.tokens.TC.name} ... getting approx: ${qTP} ${configProject.tokens.TP[tpIndex].name}... `)
  const userTCBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TC, configProject.tokens.TC.decimals))
  if (new BigNumber(qTC).gt(userTCBalance)) { throw new Error(`Insufficient ${configProject.tokens.TC.name}  user balance`) }

  // Fees user have sufficient reserve to pay?
  console.log(`To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userReserveBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`) }

  // Fees Allowance
  console.log(`Allowance: To pay fees you need > ${qAssetMaxFees.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMaxFees.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }

  // Redeem function... no values sent
  const valueToSend = dataContractStatus.swapTCforTPExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTCforTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qTPMin, configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .swapTCforTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qTPMin, configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMaxFees, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
    web3,
    new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
    estimateGas,
    encodedCall,
    MoCContractAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const mintTCandTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTP) => {
  // caller sends Asset and receives Collateral Token and Pegged Token support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.MINT_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Price of TC
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.mintTCandTPFee))
  const getPACtp = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPACtp[tpIndex]))
  const calcCtargemaCA = new BigNumber(Web3.utils.fromWei(dataContractStatus.calcCtargemaCA))

  // qCA = qTP / getPACtp + ((qTP * (calcCtargemaCA - 1) / getPACtp))
  const n1 = new BigNumber(qTP).div(getPACtp)
  const n2 = calcCtargemaCA.minus(1).times(qTP).div(getPACtp)
  const qCA = n1.plus(n2)

  const feeOperation = qCA.times(SwapFees)
  const qCAwFee = qCA.plus(feeOperation)

  console.log(`Operation w/commissions: ${qCAwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)
  console.log(`Commissions: ${feeOperation.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Add Slippage plus %
  const qAssetMax = new BigNumber(slippage).div(100).times(qCAwFee).plus(qCAwFee)

  console.log(`Slippage using ${slippage} %. Total to send: ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Verifications

  // User have sufficient reserve to pay?
  console.log(`To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your balance`)
  const userReserveBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].balance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userReserveBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} balance`) }

  // Allowance
  console.log(`Allowance: To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
  const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
  if (qAssetMax.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }

  const valueToSend = dataContractStatus.mintTCandTPExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .mintTCandTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .mintTCandTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
      web3,
      new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
      estimateGas,
      encodedCall,
      MoCContractAddress
  )

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const redeemTCandTP = async (web3, dContracts, configProject, caIndex, tpIndex, qTC) => {
  // caller sends Collateral Token and Pegged Token and receives Assets support vendor

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`

  const MoCContract = dContracts.contracts.Moc
  const MoCContractAddress = MoCContract.options.address

  // Get information from contracts
  const dataContractStatus = await statusFromContracts(web3, dContracts, configProject)

  // Get user balance address
  const userBalanceStats = await userBalanceFromContracts(web3, dContracts, configProject, userAddress)

  // Status from contracts
  const tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
  const tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
  const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.redeemTCandTPFee))
  const getCglb = new BigNumber(Web3.utils.fromWei(dataContractStatus.getCglb))

  // TC amount in CA
  const qCAtc = new BigNumber(qTC).times(tcPrice)

  // qTPtoRedeem = (qTC * pACtp * pTCac) / (cglb - 1)
  const n1 = new BigNumber(qTC).times(tpPrice).times(tcPrice)
  const n2 = new BigNumber(getCglb).minus(1)
  const qTP = n1.div(n2)
  const qCAtp = new BigNumber(qTP).div(tpPrice)

  const feeOperation = qCAtc.plus(qCAtp).times(feeParam)
  const qCAwFee = qCAtc.plus(qCAtp).minus(feeOperation)

  console.log(`Operation w/commissions: ${qCAwFee.toString()} ${configProject.tokens.CA[caIndex].name}`)
  console.log(`Commissions: ${feeOperation.toString()} ${configProject.tokens.CA[caIndex].name}`)

  // Minimum AC to receive, or fail the tx
  const qAssetMin = new BigNumber(qCAwFee).minus(new BigNumber(slippage).div(100).times(qCAwFee))
  console.log(`Slippage using ${slippage} %. Minimum limit to receive: ${qAssetMin.toString()} ${configProject.tokens.CA[caIndex].name}`)

  const qTPMax = new BigNumber(slippage).div(100).times(qTP).plus(qTP)
  console.log(`TP Max to redeem: ${qTPMax.toString()} ${configProject.tokens.TP[tpIndex].name}`)

  // Verifications

  // User have sufficient TC in balance?
  console.log(`Redeeming ${qTC} ${configProject.tokens.TC.name} ... getting approx: ${qCAtc} ${configProject.tokens.CA[caIndex].name}... `)
  const userTCBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TC.balance,
    configProject.tokens.TC.decimals))
  if (new BigNumber(qTC).gt(userTCBalance)) { throw new Error(`Insufficient ${configProject.tokens.TC.name} user balance`) }

  // User have sufficient PEGGED Token in balance?
  console.log(`Redeeming ${qTP} ${configProject.tokens.TP[tpIndex].name} ... getting approx: ${qCAtp} ${configProject.tokens.CA[caIndex].name}... `)
  const userTPBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.TP[tpIndex].balance, configProject.tokens.TP[tpIndex].decimals))
  if (new BigNumber(qTP).gt(userTPBalance)) { throw new Error(`Insufficient ${configProject.tokens.TP[tpIndex].name}  user balance`) }

  // There are sufficient CA in the contract
  const caBalance = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getACBalance[caIndex],
    configProject.tokens.CA[caIndex].decimals))
  if (new BigNumber(qCAwFee).gt(caBalance)) { throw new Error(`Insufficient ${configProject.tokens.CA[caIndex].name} in the contract. Balance: ${caBalance} ${configProject.tokens.CA[caIndex].name}`) }

  // Redeem function... no values sent
  const valueToSend = dataContractStatus.redeemTCandTPExecFee

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .redeemTCandTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMax), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .redeemTCandTP(tpIndex,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMax), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qAssetMin, configProject.tokens.CA[caIndex].decimals),
          userAddress,
          vendorAddress
      ).encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(
    web3,
    new BigNumber(fromContractPrecisionDecimals(valueToSend, 18)),
    estimateGas,
    encodedCall,
    MoCContractAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

export {
  mintTC,
  redeemTC,
  mintTP,
  redeemTP,
  swapTPforTP,
  swapTPforTC,
  swapTCforTP,
  mintTCandTP,
  redeemTCandTP
}
