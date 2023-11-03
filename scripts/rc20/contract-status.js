import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import {
    readContracts,
    contractStatus,
    userBalance,
    renderUserBalance,
    renderContractStatus
    } from '../../src/moc-v2/contracts.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts
  const dContracts = await readContracts(web3, configProject)

  // Read info from different contract in one call through Multicall
  const dataContractStatus = await contractStatus(web3, dContracts, configProject)

  console.log('\x1b[35m%s\x1b[0m', 'Contract Status')
  console.log('\x1b[32m%s\x1b[0m', renderContractStatus(dataContractStatus, configProject))
  //
  const userAddress = `${process.env.USER_ADDRESS}`.toLowerCase()
  // Get user balance
  const userBalanceStats = await userBalance(web3, dContracts, userAddress, configProject)

  console.log('\x1b[35m%s\x1b[0m', `User Balance: ${userAddress}`)
  console.log()
  console.log('\x1b[32m%s\x1b[0m', renderUserBalance(userBalanceStats, configProject))
}

main()
