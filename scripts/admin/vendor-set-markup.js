import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'
import { VendorsSetMarkup } from '../../src/moc-v2/admin.js'

dotenv.config()

// Vendor set own markup

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const vendorMarkup = '1000000000000000'

    // Send transaction and get receipt
    const { receipt, filteredEvents } = await VendorsSetMarkup(web3, dContracts, configProject, vendorMarkup)
}

main()
