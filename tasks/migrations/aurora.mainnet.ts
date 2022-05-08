import { task, types } from 'hardhat/config';
import { checkVerification } from '../../helpers/etherscan-verification';
import { ConfigNames } from '../../helpers/configuration';
import { printContracts } from '../../helpers/misc-utils';

task('aurora:mainnet', 'Deploy development enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('skipRegistry', 'Skip addresses provider registration at Addresses Provider Registry')
  .addParam('fromStep', '(Optional) Indicate the step from which migration must be started', 0, types.int)
  .setAction(async ({ verify, skipRegistry, fromStep }, DRE) => {
    const POOL_NAME = ConfigNames.Aurora;
    await DRE.run('set-DRE');
 
    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log('Migration started\n');

    if (fromStep <= 0) {
      console.log('0. Deploy address provider registry');
      await DRE.run('full:deploy-address-provider-registry', { pool: POOL_NAME });
    }

    if (fromStep <= 1) {
      console.log('1. Deploy address provider');
      await DRE.run('full:deploy-address-provider', { pool: POOL_NAME, skipRegistry });
    }

    if (fromStep <= 2) {
      console.log('2. Deploy lending pool');
      await DRE.run('full:deploy-lending-pool', { pool: POOL_NAME });
    }

    if (fromStep <= 3) {
      console.log('3. Deploy oracles');
      await DRE.run('full:deploy-oracles', { pool: POOL_NAME, verify });
    }

    if (fromStep <= 4) {
      console.log('4. Deploy Data Provider');
      await DRE.run('full:data-provider', { pool: POOL_NAME });
    }

    if (fromStep <= 5) {
      console.log('5. Deploy Staking');
      await DRE.run('full:staking', { pool: POOL_NAME });
    }

    if (fromStep <= 6) {
      // console.log('6. Deploy WETH Gateway');
      // await DRE.run('full-deploy-weth-gateway', { pool: POOL_NAME });
    }

    if (fromStep <= 7) {
      console.log('7. Initialize lending pool');
      await DRE.run('full:initialize-lending-pool', { pool: POOL_NAME });

      if (verify) {
        printContracts();
        console.log('8. Veryfing contracts');
        await DRE.run('verify:general', { all: true, pool: POOL_NAME });

        console.log('9. Veryfing aTokens and debtTokens');
        await DRE.run('verify:tokens', { pool: POOL_NAME });
      }
    }

    console.log('\nFinished migrations');
    printContracts();
  });
