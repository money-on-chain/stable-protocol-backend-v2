import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { QueueExecute } from '../../src/moc-v2/admin.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const feeRecipient = '0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3';

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await QueueExecute(web3, dContracts, configProject, feeRecipient)
}

main()
