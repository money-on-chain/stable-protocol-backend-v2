import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../../src/utils.js'
import { readContracts } from '../../../../src/moc-v2/contracts.js'
import { preVote } from '../../../../src/omoc/vesting.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const changeContractAddress = '0xf6F7063c5Da82e6a4e87Ca996b0F82ff06953c12';

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await preVote(web3, dContracts, changeContractAddress)
}

main()
