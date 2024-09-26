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

    const changeContractAddress = '0x9ccb5ba1D7ebD746044458A23FB6af80836Dba70';

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await unRegister(web3, dContracts, changeContractAddress)
}

main()
