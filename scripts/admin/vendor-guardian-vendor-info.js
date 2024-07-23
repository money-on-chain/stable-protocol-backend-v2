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

  const vendorAddress = '0xf69287F5Ca3cC3C6d3981f2412109110cB8af076'

  const MocVendors = dContracts.contracts.MocVendors
  const markup = await MocVendors.methods.vendorMarkup(vendorAddress).call()
  const guardian = await MocVendors.methods.vendorsGuardianAddress().call()

  console.log(`Guardian: ${guardian.toString()}`)
  console.log(`Markup: ${markup.toString()}`)
}

main()
