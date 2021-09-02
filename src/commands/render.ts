import { Command, flags } from '@oclif/command'
import { commonFlags, instanceArg } from '../flags';
import { processInstances, readKonfig } from '../util';

export default class Render extends Command {
  static description = "render instance manifests";

//   static examples = [
//     `$ konfigure hello
// hello world from ./src/hello.ts!
// `,
//   ]

  static flags = {
    ...commonFlags
  }
  
  static strict = false
  static args = [instanceArg]

  async run() {
    const { argv, flags: {
      dryrun, testing, auth, debug
    }} = this.parse(Render)

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

    const konfig = readKonfig();
    this.log(konfig.toString());
  }
}
