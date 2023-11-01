import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { UpdateEma } from '../../src/moc-v2/moc-base.js'

dotenv.config()

const main = async () => {

    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await UpdateEma(web3, dContracts, configProject)
}

main()
