// Redeem TP

import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { swapTPforTC } from '../../src/moc-v2/moc-coinbase'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts
  const dContracts = await readContracts(web3, configProject)

  // Get amount from environment
  const tpIndex = 0
  const qTP = `${process.env.OPERATION_AMOUNT_SWAP_TP_FOR_TC}`

  const { receipt, filteredEvents } = await swapTPforTC(web3, dContracts, configProject, tpIndex, qTP)
}

main()
