import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { AllowanceUse } from '../../src/moc-v2/moc-base.js'

dotenv.config()

const main = async () => {
  const configPath = './settings/projects.json'
  const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

  // get web3 connection
  const web3 = getWeb3(process.env.HOST_URI)

  // Obtain all contracts
  const dContracts = await readContracts(web3, configProject)

  // Token to approve
  const token = dContracts.contracts.TP[0]
  const tokenDecimals = configProject.tokens.TP[0].decimals

  // Send transaction and get receipt
  const { receipt, filteredEvents } = await AllowanceUse(web3, dContracts, configProject, token, true, tokenDecimals)
}

main()
