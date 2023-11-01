import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../src/utils.js'
import { readContracts } from '../../src/moc-v2/contracts.js'

dotenv.config()

const main = async () => {

    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    // Obtain all contracts
    const dContracts = await readContracts(web3, configProject)

    const vendorAddress = '0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3';

    const MocVendors = dContracts.contracts.MocVendorsCABag
    const markup = await MocVendors.methods.vendorMarkup(vendorAddress).call()

    console.log(`Markup: ${markup.toString()}`)

}

main()
