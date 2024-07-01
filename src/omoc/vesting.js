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


const addStake = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const stakingmachine = dContracts.contracts.stakingmachine
    const stakingMachineAddress = stakingmachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const target = stakingMachineAddress
    const data = stakingmachine.methods.deposit(toContractPrecisionDecimals(amount, tokenDecimals),
        Web3.utils.toChecksumAddress(vestingMachineAddress)).encodeABI()

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .callWithData(target, data)
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .callWithData(target, data)
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const unStake = async (web3, dContracts, configProject, amount) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const stakingmachine = dContracts.contracts.stakingmachine
    const stakingMachineAddress = stakingmachine.options.address
    const tokenDecimals = configProject.tokens.TG.decimals

    const target = stakingMachineAddress
    const data = stakingmachine.methods.withdraw(toContractPrecisionDecimals(amount, tokenDecimals)).encodeABI()

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .callWithData(target, data)
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .callWithData(target, data)
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const cancelWithdrawDelay = async (web3, dContracts, configProject, idWithdraw) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const delaymachine = dContracts.contracts.delaymachine
    const delayMachineAddress = delaymachine.options.address

    const target = delayMachineAddress
    const data = delaymachine.methods.cancel(idWithdraw).encodeABI()

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .callWithData(target, data)
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .callWithData(target, data)
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, vestingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const withdrawDelay = async (web3, dContracts, configProject, idWithdraw) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const vestingMachine = dContracts.contracts.ivestingmachine
    const vestingMachineAddress = vestingMachine.options.address
    const delaymachine = dContracts.contracts.delaymachine
    const delayMachineAddress = delaymachine.options.address

    const target = delayMachineAddress
    const data = delaymachine.methods.withdraw(idWithdraw).encodeABI()

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await vestingMachine.methods
        .callWithData(target, data)
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = vestingMachine.methods
        .callWithData(target, data)
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
    withdrawAll,
    addStake,
    unStake,
    cancelWithdrawDelay,
    withdrawDelay
}
