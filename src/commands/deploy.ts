import { Command, flags } from '@oclif/command'
import { commonFlags } from '../flags';
import { processInstances } from '../util';

export default class Deploy extends Command {
  static description = "deploy instances to the current environment";

//   static examples = [
//     `$ konfigure hello
// hello world from ./src/hello.ts!
// `,
//   ]

  static flags = {
    help: flags.help({ char: 'h' }),
    ...commonFlags
  }
  
  static strict = false
  static args = [{
    name: "instances",
    description:  "the instances to deploy",
    required: true
  }]

  async run() {
    const { argv, flags: {
      dryrun, testing, auth, debug
    }} = this.parse(Deploy)

    this.log("deploy command");

    if(dryrun)
      this.log("-- DRYRUN MODE --")
    if(testing)
      this.log("-- TESTING MODE --")
    if(auth)
      this.log("-- AUTH MODE --")
    if(debug)
      this.log("-- DEBUG MODE --")

    processInstances(argv)
  }
}
