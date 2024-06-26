import Web3 from 'web3'

import { sendTransaction } from '../transaction.js'
import {toContractPrecisionDecimals} from "../utils.js";


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


const addStake = async (web3, dContracts, configProject, amount) => {

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const stakingmachine = dContracts.contracts.stakingmachine
  const stakingMachineAddress = stakingmachine.options.address
  const tokenDecimals = configProject.tokens.FeeToken.decimals

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await stakingmachine.methods
      .deposit(toContractPrecisionDecimals(amount, tokenDecimals), Web3.utils.toChecksumAddress(userAddress))
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = stakingmachine.methods
      .deposit(toContractPrecisionDecimals(amount, tokenDecimals), Web3.utils.toChecksumAddress(userAddress))
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, stakingMachineAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}


const unStake = async (web3, dContracts, configProject, amount) => {

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const stakingmachine = dContracts.contracts.stakingmachine
  const stakingMachineAddress = stakingmachine.options.address
  const tokenDecimals = configProject.tokens.FeeToken.decimals

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await stakingmachine.methods
      .withdraw(toContractPrecisionDecimals(amount, tokenDecimals))
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = stakingmachine.methods
      .withdraw(toContractPrecisionDecimals(amount, tokenDecimals))
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, stakingMachineAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}


const delayMachineWithdraw = async (web3, dContracts, configProject, idWithdraw) => {

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const delaymachine = dContracts.contracts.delaymachine
  const delayMachineAddress = delaymachine.options.address

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await delaymachine.methods
      .withdraw(idWithdraw)
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = delaymachine.methods
      .withdraw(idWithdraw)
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, delayMachineAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}

const delayMachineCancelWithdraw = async (web3, dContracts, configProject, idWithdraw) => {

  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  const delaymachine = dContracts.contracts.delaymachine
  const delayMachineAddress = delaymachine.options.address

  const valueToSend = null

  // Calculate estimate gas cost
  const estimateGas = await delaymachine.methods
      .cancel(idWithdraw)
      .estimateGas({ from: userAddress, value: '0x' })

  // encode function
  const encodedCall = delaymachine.methods
      .cancel(idWithdraw)
      .encodeABI()

  // send transaction to the blockchain and get receipt
  const { receipt, filteredEvents } = await sendTransaction(web3, valueToSend, estimateGas, encodedCall, delayMachineAddress)

  console.log(`Transaction hash: ${receipt.transactionHash}`)

  return { receipt, filteredEvents }
}


export {
  vestingVerify,
  addStake,
  unStake,
  delayMachineWithdraw,
  delayMachineCancelWithdraw
}
