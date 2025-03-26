import {
    redeemTC as redeemTC_,
    redeemTP as redeemTP_,
    redeemTCandTP as redeemTCandTP_
} from './moc-core.js'
import {statusFromContracts, userBalanceFromContracts} from "./contracts.js";
import BigNumber from "bignumber.js";
import Web3 from "web3";
import {fromContractPrecisionDecimals, toContractPrecisionDecimals, getExecutionFee} from "../utils.js";
import {sendTransaction} from "../transaction.js";

const mintTC = async (web3, dContracts, configProject, qTC) => {
    // Mint Collateral token with Coinbase support vendors

    const caIndex = 0;
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
    const tcPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPTCac))
    const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tcMintFee))

    // TC amount in CA
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

    let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.tcMintExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMax)
    valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

    // Calculate estimate gas cost
    const estimateGas = await MoCContract.methods
        .mintTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
            userAddress,
            vendorAddress
        ).estimateGas({ from: userAddress, value: valueToSend })
    // encode function
    const encodedCall = MoCContract.methods
        .mintTC(toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
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

const redeemTC = async (web3, dContracts, configProject, qTC) => {
    // Redeem Collateral token receiving CA support vendors
    return redeemTC_(web3, dContracts, configProject, 0, qTC)
}

const mintTP = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // Mint pegged token with collateral Coinbase support vendor

    const caIndex = 0
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
    const tpPrice = new BigNumber(Web3.utils.fromWei(dataContractStatus.PP_TP[tpIndex]))
    const feeParam = new BigNumber(Web3.utils.fromWei(dataContractStatus.tpMintFees[tpIndex]))

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
    /*
    console.log(`Allowance: To mint ${qTP} ${configProject.tokens.TP[tpIndex].name} you need > ${qAssetMax.toString()} ${configProject.tokens.CA[caIndex].name} in your spendable balance`)
    const userSpendableBalance = new BigNumber(fromContractPrecisionDecimals(userBalanceStats.CA[caIndex].allowance, configProject.tokens.CA[caIndex].decimals))
    if (qAssetMax.gt(userSpendableBalance)) { throw new Error('Insufficient spendable balance... please make an allowance to the MoC contract') }
     */

    // There are sufficient PEGGED in the contracts to mint?
    const tpAvailableToMint = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.getTPAvailableToMint[tpIndex], configProject.tokens.TP[tpIndex].decimals))
    const qAssetAvailableToMint = new BigNumber(tpAvailableToMint).div(tpPrice)
    if (new BigNumber(qAssetMax).gt(qAssetAvailableToMint)) { throw new Error(`Insufficient ${configProject.tokens.TP.name} available to mint`) }

    let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.tpMintExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMax)
    valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

    // Calculate estimate gas cost
    const estimateGas = await MoCContract.methods
        .mintTP(
            tpAddress,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            //toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
            userAddress,
            vendorAddress
        ).estimateGas({ from: userAddress, value: valueToSend })

    // encode function
    const encodedCall = MoCContract.methods
        .mintTP(
            tpAddress,
            toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
            //toContractPrecisionDecimals(qAssetMax, configProject.tokens.CA[caIndex].decimals),
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

const redeemTP = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // Redeem pegged token receiving CA support vendor
    return redeemTP_(web3, dContracts, configProject, 0, tpIndex, qTP)
}

const swapTPforTP = async (web3, dContracts, configProject, iFromTP, iToTP, qTP) => {
    // caller sends a Pegged Token and receives another one support vendor

  const caIndex = 0;
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const slippage = `${process.env.REDEEM_SLIPPAGE}`
  const tpFromAddress = dContracts.contracts.TP[iFromTP].options.address
  const tpToAddress = dContracts.contracts.TP[iToTP].options.address

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

  let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.swapTPforTPExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMaxFees)
  valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTPforTP(tpFromAddress,
        tpToAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })
  
  // encode function
  const encodedCall = MoCContract.methods
      .swapTPforTP(tpFromAddress,
        tpToAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[iFromTP].decimals),
          toContractPrecisionDecimals(new BigNumber(qTPMin), configProject.tokens.TP[iToTP].decimals),
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

const swapTPforTC = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // caller sends a Pegged Token and receives Collateral Token support vendor
  const caIndex = 0;
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

  let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.swapTPforTCExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMaxFees)
  valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTPforTC(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qTCMin, configProject.tokens.TC.decimals),
          userAddress,
          vendorAddress
      )
      .estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .swapTPforTC(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          toContractPrecisionDecimals(qTCMin, configProject.tokens.TC.decimals),
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

const swapTCforTP = async (web3, dContracts, configProject, tpIndex, qTC) => {
    // caller sends Collateral Token and receives Pegged Token support vendor
  const caIndex = 0;
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const vendorAddress = `${process.env.VENDOR_ADDRESS}`.toLowerCase()
  const tpAddress = dContracts.contracts.TP[tpIndex].options.address
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
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.swapTCforTPFee))

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

  let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.swapTCforTPExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMaxFees)
  valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .swapTCforTP(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qTPMin, configProject.tokens.TP[tpIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .swapTCforTP(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTC), configProject.tokens.TC.decimals),
          toContractPrecisionDecimals(qTPMin, configProject.tokens.TP[tpIndex].decimals),
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

const mintTCandTP = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // caller sends Asset and receives Collateral Token and Pegged Token support vendor
  const caIndex = 0;
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

  // Price of TC
  const SwapFees = new BigNumber(Web3.utils.fromWei(dataContractStatus.mintTCandTPFee))
  const getPACtp = new BigNumber(Web3.utils.fromWei(dataContractStatus.getPACtp[tpIndex]))
  const getCtargemaCA = new BigNumber(Web3.utils.fromWei(dataContractStatus.getCtargemaCA))

  // qCA = qTP / getPACtp + ((qTP * (getCtargemaCA - 1) / getPACtp))
  const n1 = new BigNumber(qTP).div(getPACtp)
  const n2 = getCtargemaCA.minus(1).times(qTP).div(getPACtp)
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

  let valueToSend = new BigNumber(fromContractPrecisionDecimals(await getExecutionFee(web3, dataContractStatus.mintTCandTPExecCost, slippage), configProject.tokens.CA[caIndex].decimals)).plus(qAssetMax)
    valueToSend = toContractPrecisionDecimals(valueToSend, configProject.tokens.CA[caIndex].decimals)

  // Calculate estimate gas cost
  const estimateGas = await MoCContract.methods
      .mintTCandTP(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
          userAddress,
          vendorAddress
      ).estimateGas({ from: userAddress, value: valueToSend })

  // encode function
  const encodedCall = MoCContract.methods
      .mintTCandTP(tpAddress,
          toContractPrecisionDecimals(new BigNumber(qTP), configProject.tokens.TP[tpIndex].decimals),
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

const redeemTCandTP = async (web3, dContracts, configProject, tpIndex, qTC) => {
    // caller sends Collateral Token and Pegged Token and receives Assets support vendor
    return redeemTCandTP_(web3, dContracts, configProject, 0, tpIndex, qTC)
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
