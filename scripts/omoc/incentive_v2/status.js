import * as dotenv from 'dotenv'

import { readJsonFile, getWeb3 } from '../../../src/utils.js'
import {
    incentiveStatus
} from '../../../src/omoc/incentive_v2.js'

dotenv.config()

const main = async () => {
    const configPath = './settings/projects.json'
    const configProject = readJsonFile(configPath).projects[process.env.MOC_PROJECT.toLowerCase()]

    // get web3 connection
    const web3 = getWeb3(process.env.HOST_URI)

    const accountAddress = "0xCD8A1c9aCc980ae031456573e34dC05cD7daE6e3"

    // Contract status
    await incentiveStatus(web3, accountAddress)

}

main()
