import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { VendorsGuardianSetMarkup } from '../../src/moc-v2/moc-base.js'

dotenv.config()

const main = async () => {

    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const vendorAddress = '0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3';
    const vendorMarkup = '1000000000000000';

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await VendorsGuardianSetMarkup(web3, dContracts, configProject, vendorAddress, vendorMarkup)
}

main()
