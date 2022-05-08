import { task } from 'hardhat/config';
import {
  deployToreusToken,
  deployMultiFeeDistribution,
  deployChefIncentivesController,
  deployMasterChef,
  deployMerkleDistributor,
  deployTokenVesting,
} from '../../helpers/contracts-deployments';
import { ConfigNames } from '../../helpers/configuration';
import { getLendingPoolConfiguratorProxy } from '../../helpers/contracts-getters';
import { exit } from 'process';

task('full:staking', 'Initialize staking.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    try {
      await localBRE.run('set-DRE');

      const token = await deployToreusToken(['100000000000000000000000000000'], verify); // 100B
      const multiFeeDistr = await deployMultiFeeDistribution([token.address], verify);

      const configurator = await getLendingPoolConfiguratorProxy();
      const incentivesController = await deployChefIncentivesController(
        [['0'], ['1'], configurator.address, multiFeeDistr.address, '1000000000000000000000000000'], // 1B
        verify
      );
      const masterChef = await deployMasterChef(
        [['0'], ['1'], configurator.address, multiFeeDistr.address, '1000000000000000000000000000'], // 1B
        verify
      );
      const merkleDistributor = await deployMerkleDistributor(
        [multiFeeDistr.address, '1000000000000000000000000000'], // 1B
        verify
      );
      const tokenVesting = await deployTokenVesting([multiFeeDistr.address, '0', [], []], verify);
      await multiFeeDistr.setMinters([
        incentivesController.address,
        masterChef.address,
        merkleDistributor.address,
        tokenVesting.address,
      ]);
      await multiFeeDistr.transferOwnership(configurator.address);
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });
