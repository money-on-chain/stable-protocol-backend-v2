import { sendTransaction } from '../transaction.js'
import {toContractPrecisionDecimals} from "../utils.js";
import Web3 from "web3";


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

const approve = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .approve(toContractPrecisionDecimals(amount, tokenDecimals))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .approve(toContractPrecisionDecimals(amount, tokenDecimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const deposit = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .deposit(toContractPrecisionDecimals(amount, tokenDecimals))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .deposit(toContractPrecisionDecimals(amount, tokenDecimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const withdraw = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .withdraw(toContractPrecisionDecimals(amount, tokenDecimals))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .withdraw(toContractPrecisionDecimals(amount, tokenDecimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const withdrawAll = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .withdrawAll(toContractPrecisionDecimals(amount, tokenDecimals))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .withdrawAll(toContractPrecisionDecimals(amount, tokenDecimals))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


export {
    vestingVerify,
    approve,
    deposit,
    withdraw,
    withdrawAll
}
