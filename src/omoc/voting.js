import {toContractPrecisionDecimals} from "../utils.js";
import Web3 from "web3";
import {sendTransaction} from "../transaction.js";


const preVote = async (web3, dContracts, changeContractAddress) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const votingMachine = dContracts.contracts.votingmachine
    const votingMachineAddress = votingMachine.options.address

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await votingMachine.methods
        .preVote(Web3.utils.toChecksumAddress(changeContractAddress))
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = votingMachine.methods
        .preVote(Web3.utils.toChecksumAddress(changeContractAddress))
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, votingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const vote = async (web3, dContracts, inFavorAgainst) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const votingMachine = dContracts.contracts.votingmachine
    const votingMachineAddress = votingMachine.options.address

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await votingMachine.methods
        .vote(inFavorAgainst)
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = votingMachine.methods
        .vote(inFavorAgainst)
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, votingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const preVoteStep = async (web3, dContracts) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const votingMachine = dContracts.contracts.votingmachine
    const votingMachineAddress = votingMachine.options.address

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await votingMachine.methods
        .preVoteStep()
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = votingMachine.methods
        .preVoteStep()
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, votingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const voteStep = async (web3, dContracts) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const votingMachine = dContracts.contracts.votingmachine
    const votingMachineAddress = votingMachine.options.address

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await votingMachine.methods
        .voteStep()
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = votingMachine.methods
        .voteStep()
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, votingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}


const acceptedStep = async (web3, dContracts) => {

    const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
    const votingMachine = dContracts.contracts.votingmachine
    const votingMachineAddress = votingMachine.options.address

    const valueToSend = null

    // Calculate estimate gas cost
    const estimateGas = await votingMachine.methods
        .acceptedStep()
        .estimateGas({ from: userAddress, value: '0x' })

    // encode function
    const encodedCall = votingMachine.methods
        .acceptedStep()
        .encodeABI()

    // send transaction to the blockchain and get receipt
    const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, votingMachineAddress)

    console.log(`Transaction hash: ${receipt.transactionHash}`)

    return { receipt, filteredEvents }
}

export {
    preVote,
    vote,
    preVoteStep,
    voteStep,
    acceptedStep
}
