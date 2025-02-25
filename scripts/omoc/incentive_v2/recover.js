import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import {
    recoverMessage
} from '../../../src/omoc/incentive_v2.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    const sourceData = "0x3267cce547508bbbc54f5b72943e1abcc0d5594d2f60ab1f75cb08f276c4a12e6a3463504902516bc5970202bdd18371803437fb380d390e2ed6c2feaffc5eb91c"
    const chainID = 31

    // Contract status
    const recoveredAddress = await recoverMessage(web3, sourceData, chainID)

    console.log(`Recovered address: ${recoveredAddress}`)

}

main()
