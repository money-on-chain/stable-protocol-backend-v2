import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import { readContracts } from '../../../src/moc-v2/contracts.js'
import { unRegister } from '../../../src/omoc/voting.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const changeContractAddress = '0x975Bcf5D21A456C539bc7CcE008fC288D511D447';

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await unRegister(web3, dContracts, changeContractAddress)
}

main()
