import {
    redeemTC as redeemTC_,
    redeemTP as redeemTP_,
    swapTPforTP as swapTPforTP_,
    swapTPforTC as swapTPforTC_,
    swapTCforTP as swapTCforTP_,
    mintTCandTP as mintTCandTP_,
    redeemTCandTP as redeemTCandTP_
} from './moc-core.js'
import {statusFromContracts, userBalanceFromContracts} from "./contracts.js";
import BigNumber from "bignumber.js";
import Web3 from "web3";
import {fromContractPrecisionDecimals, toContractPrecisionDecimals} from "../utils.js";
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

    let valueToSend = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.tcMintExecFee, configProject.tokens.CA[caIndex].decimals)).plus(qAssetMax)
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

    let valueToSend = new BigNumber(fromContractPrecisionDecimals(dataContractStatus.tpMintExecFee, configProject.tokens.CA[caIndex].decimals)).plus(qAssetMax)
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
    return swapTPforTP_(web3, dContracts, configProject, iFromTP, iToTP, qTP, 0)
}

const swapTPforTC = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // caller sends a Pegged Token and receives Collateral Token support vendor
    return swapTPforTC_(web3, dContracts, configProject, 0, tpIndex, qTP)
}

const swapTCforTP = async (web3, dContracts, configProject, tpIndex, qTC) => {
    // caller sends Collateral Token and receives Pegged Token support vendor
    return swapTCforTP_(web3, dContracts, configProject, 0, tpIndex, qTC)
}

const mintTCandTP = async (web3, dContracts, configProject, tpIndex, qTP) => {
    // caller sends Asset and receives Collateral Token and Pegged Token support vendor
    return mintTCandTP_(web3, dContracts, configProject, 0, tpIndex, qTP)
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
