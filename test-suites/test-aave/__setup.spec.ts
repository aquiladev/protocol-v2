import rawBRE from 'hardhat';
import { MockContract } from 'ethereum-waffle';
import {
  insertContractAddressInDb,
  getEthersSigners,
  registerContractInJsonDb,
  getEthersSignersAddresses,
} from '../../helpers/contracts-helpers';
import {
  deployLendingPoolAddressesProvider,
  deployMintableERC20,
  deployLendingPoolAddressesProviderRegistry,
  deployLendingPoolConfigurator,
  deployLendingPool,
  deployPriceOracle,
  deployLendingPoolCollateralManager,
  deployMockFlashLoanReceiver,
  deployWalletBalancerProvider,
  deployAaveProtocolDataProvider,
  deployLendingRateOracle,
  deployStableAndVariableTokensHelper,
  deployATokensAndRatesHelper,
  deployWETHGateway,
  deployWETHMocked,
  deployMockUniswapRouter,
  deployUniswapLiquiditySwapAdapter,
  deployUniswapRepayAdapter,
  deployFlashLiquidationAdapter,
  deployMockParaSwapAugustus,
  deployMockParaSwapAugustusRegistry,
  deployParaSwapLiquiditySwapAdapter,
  authorizeWETHGateway,
  deployATokenImplementations,
  deployAaveOracle,
  deployChefIncentivesController,
  deployMultiFeeDistribution,
  deployToreusToken,
} from '../../helpers/contracts-deployments';
import { Signer } from 'ethers';
import { TokenContractId, eContractid, tEthereumAddress, AavePools } from '../../helpers/types';
import { MintableERC20 } from '../../types/MintableERC20';
import {
  ConfigNames,
  getReservesConfigByPool,
  getTreasuryAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import { initializeMakeSuite } from './helpers/make-suite';

import {
  setInitialAssetPricesInOracle,
  deployAllMockAggregators,
  setInitialMarketRatesInRatesOracleByHelper,
  deployAllMockPriceFeeds,
} from '../../helpers/oracles-helpers';
import { DRE, waitForTx } from '../../helpers/misc-utils';
import { initReservesByHelper, configureReservesByHelper } from '../../helpers/init-helpers';
import AaveConfig from '../../markets/aave';
import { oneEther, ZERO_ADDRESS } from '../../helpers/constants';
import {
  getLendingPool,
  getLendingPoolConfiguratorProxy,
  getPairsTokenAggregator,
  getPairsTokenPriceFeed,
} from '../../helpers/contracts-getters';
import { WETH9Mocked } from '../../types/WETH9Mocked';

const MOCK_USD_PRICE_IN_WEI = AaveConfig.ProtocolGlobalParams.MockUsdPriceInWei;
const ALL_ASSETS_INITIAL_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;
const USD_ADDRESS = AaveConfig.ProtocolGlobalParams.UsdAddress;
const LENDING_RATE_ORACLE_RATES_COMMON = AaveConfig.LendingRateOracleRatesCommon;

const deployAllMockTokens = async (deployer: Signer) => {
  const tokens: { [symbol: string]: MockContract | MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = getReservesConfigByPool(AavePools.proto);

  for (const tokenSymbol of Object.keys(TokenContractId)) {
    if (tokenSymbol === 'WETH') {
      tokens[tokenSymbol] = await deployWETHMocked();
      console.log(tokenSymbol, tokens[tokenSymbol].address)
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }
    let decimals = 18;

    let configData = (<any>protoConfigData)[tokenSymbol];

    if (!configData) {
      decimals = 18;
    }

    tokens[tokenSymbol] = await deployMintableERC20([
      tokenSymbol,
      tokenSymbol,
      configData ? configData.reserveDecimals : 18,
    ]);
    console.log(tokenSymbol, tokens[tokenSymbol].address)
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }

  return tokens;
};

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');
  const aaveAdmin = await deployer.getAddress();
  const config = loadPoolConfig(ConfigNames.Aave);

  const mockTokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked;
  } = {
    ...(await deployAllMockTokens(deployer)),
  };
  const addressesProvider = await deployLendingPoolAddressesProvider(AaveConfig.MarketId);
  await waitForTx(await addressesProvider.setPoolAdmin(aaveAdmin));

  //setting users[1] as emergency admin, which is in position 2 in the DRE addresses list
  const addressList = await getEthersSignersAddresses();

  await waitForTx(await addressesProvider.setEmergencyAdmin(addressList[2]));

  const addressesProviderRegistry = await deployLendingPoolAddressesProviderRegistry();
  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(addressesProvider.address, 1)
  );

  const lendingPoolImpl = await deployLendingPool();
  await waitForTx(await addressesProvider.setLendingPoolImpl(lendingPoolImpl.address));

  const lendingPoolAddress = await addressesProvider.getLendingPool();
  const lendingPoolProxy = await getLendingPool(lendingPoolAddress);
  await insertContractAddressInDb(eContractid.LendingPool, lendingPoolProxy.address);

  const lendingPoolConfiguratorImpl = await deployLendingPoolConfigurator();
  await waitForTx(
    await addressesProvider.setLendingPoolConfiguratorImpl(lendingPoolConfiguratorImpl.address)
  );
  const lendingPoolConfiguratorProxy = await getLendingPoolConfiguratorProxy(
    await addressesProvider.getLendingPoolConfigurator()
  );
  await insertContractAddressInDb(
    eContractid.LendingPoolConfigurator,
    lendingPoolConfiguratorProxy.address
  );

  // Deploy deployment helpers
  await deployStableAndVariableTokensHelper([lendingPoolProxy.address, addressesProvider.address]);
  await deployATokensAndRatesHelper([
    lendingPoolProxy.address,
    addressesProvider.address,
    lendingPoolConfiguratorProxy.address,
  ]);

  const fallbackOracle = await deployPriceOracle();
  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  await setInitialAssetPricesInOracle(
    ALL_ASSETS_INITIAL_PRICES,
    {
      WETH: mockTokens.WETH.address,
      DAI: mockTokens.DAI.address,
      TUSD: mockTokens.TUSD.address,
      USDC: mockTokens.USDC.address,
      USDT: mockTokens.USDT.address,
      SUSD: mockTokens.SUSD.address,
      AAVE: mockTokens.AAVE.address,
      BAT: mockTokens.BAT.address,
      MKR: mockTokens.MKR.address,
      LINK: mockTokens.LINK.address,
      KNC: mockTokens.KNC.address,
      WBTC: mockTokens.WBTC.address,
      MANA: mockTokens.MANA.address,
      ZRX: mockTokens.ZRX.address,
      SNX: mockTokens.SNX.address,
      BUSD: mockTokens.BUSD.address,
      YFI: mockTokens.BUSD.address,
      REN: mockTokens.REN.address,
      UNI: mockTokens.UNI.address,
      ENJ: mockTokens.ENJ.address,
      // DAI: mockTokens.LpDAI.address,
      // USDC: mockTokens.LpUSDC.address,
      // USDT: mockTokens.LpUSDT.address,
      // WBTC: mockTokens.LpWBTC.address,
      // WETH: mockTokens.LpWETH.address,
      UniDAIWETH: mockTokens.UniDAIWETH.address,
      UniWBTCWETH: mockTokens.UniWBTCWETH.address,
      UniAAVEWETH: mockTokens.UniAAVEWETH.address,
      UniBATWETH: mockTokens.UniBATWETH.address,
      UniDAIUSDC: mockTokens.UniDAIUSDC.address,
      UniCRVWETH: mockTokens.UniCRVWETH.address,
      UniLINKWETH: mockTokens.UniLINKWETH.address,
      UniMKRWETH: mockTokens.UniMKRWETH.address,
      UniRENWETH: mockTokens.UniRENWETH.address,
      UniSNXWETH: mockTokens.UniSNXWETH.address,
      UniUNIWETH: mockTokens.UniUNIWETH.address,
      UniUSDCWETH: mockTokens.UniUSDCWETH.address,
      UniWBTCUSDC: mockTokens.UniWBTCUSDC.address,
      UniYFIWETH: mockTokens.UniYFIWETH.address,
      BptWBTCWETH: mockTokens.BptWBTCWETH.address,
      BptBALWETH: mockTokens.BptBALWETH.address,
      WMATIC: mockTokens.WMATIC.address,
      USD: USD_ADDRESS,
      STAKE: mockTokens.STAKE.address,
      xSUSHI: mockTokens.xSUSHI.address,
      WAVAX: mockTokens.WAVAX.address,
    },
    fallbackOracle
  );

  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, tokenContract]) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );

  // const mockAggregators = await deployAllMockAggregators(ALL_ASSETS_INITIAL_PRICES);
  // const allAggregatorsAddresses = Object.entries(mockAggregators).reduce(
  //   (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, aggregator]) => ({
  //     ...accum,
  //     [tokenSymbol]: aggregator.address,
  //   }),
  //   {}
  // );

  // const [tokens, aggregators] = getPairsTokenAggregator(
  //   allTokenAddresses,
  //   allAggregatorsAddresses,
  //   config.OracleQuoteCurrency
  // );

  // const aaveOracle = await deployAaveOracle([
  //   tokens,
  //   aggregators,
  //   fallbackOracle.address,
  //   mockTokens.WETH.address,
  //   oneEther.toString(),
  // ]);
  // await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

  const mockPriceFeeds = await deployAllMockPriceFeeds(allTokenAddresses, fallbackOracle.address);
  const allFeedsAddresses = Object.entries(mockPriceFeeds).reduce(
    (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, feed]) => ({
      ...accum,
      [tokenSymbol]: feed.address,
    }),
    {}
  );

  const [tokens, priceFeeds] = getPairsTokenPriceFeed(
    allTokenAddresses,
    allFeedsAddresses
  );

  const aaveOracle = await deployAaveOracle([ tokens, priceFeeds ]);
  console.log('=========AaveOracle', aaveOracle.address);
  await waitForTx(await addressesProvider.setPriceOracle(aaveOracle.address));

  const lendingRateOracle = await deployLendingRateOracle();
  console.log('=========LendingRateOracle', lendingRateOracle.address);
  await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));

  const { USD, ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = { ...tokensAddressesWithoutUsd };
  await setInitialMarketRatesInRatesOracleByHelper(
    LENDING_RATE_ORACLE_RATES_COMMON,
    allReservesAddresses,
    lendingRateOracle,
    aaveAdmin
  );

  // Reserve params from AAVE pool + mocked tokens
  const reservesParams = {
    ...config.ReservesConfig,
  };

  const testHelpers = await deployAaveProtocolDataProvider(addressesProvider.address);

  await deployATokenImplementations(ConfigNames.Aave, reservesParams, false);

  const admin = await deployer.getAddress();

  const { ATokenNamePrefix, StableDebtTokenNamePrefix, VariableDebtTokenNamePrefix, SymbolPrefix } =
    config;
  // const treasuryAddress = await getTreasuryAddress(config);
  const treasury = await deployToreusToken(['1000000000000000000000000000'], false); // 1B
  const treasuryAddress = treasury.address;

  const multiFeeDistribution = await deployMultiFeeDistribution([treasuryAddress], false);
  await multiFeeDistribution['transferOwnership(address)'](lendingPoolConfiguratorProxy.address);

  const incentivesController = await deployChefIncentivesController(
    [[], [], lendingPoolConfiguratorProxy.address, ZERO_ADDRESS, '0'],
    false,
  );

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    multiFeeDistribution.address,
    incentivesController.address,
    ConfigNames.Aave,
    false
  );

  await configureReservesByHelper(reservesParams, allReservesAddresses, testHelpers, admin);

  const collateralManager = await deployLendingPoolCollateralManager();
  await waitForTx(
    await addressesProvider.setLendingPoolCollateralManager(collateralManager.address)
  );
  await deployMockFlashLoanReceiver(addressesProvider.address);

  // const mockUniswapRouter = await deployMockUniswapRouter();

  // const adapterParams: [string, string, string] = [
  //   addressesProvider.address,
  //   mockUniswapRouter.address,
  //   mockTokens.WETH.address,
  // ];

  // await deployUniswapLiquiditySwapAdapter(adapterParams);
  // await deployUniswapRepayAdapter(adapterParams);
  // await deployFlashLiquidationAdapter(adapterParams);

  // const augustus = await deployMockParaSwapAugustus();

  // const augustusRegistry = await deployMockParaSwapAugustusRegistry([augustus.address]);

  // await deployParaSwapLiquiditySwapAdapter([addressesProvider.address, augustusRegistry.address]);

  await deployWalletBalancerProvider();

  const gateWay = await deployWETHGateway([mockTokens.WETH.address]);
  await authorizeWETHGateway(gateWay.address, lendingPoolAddress);

  console.timeEnd('setup');
};

before(async () => {
  await rawBRE.run('set-DRE');
  const [deployer, secondaryWallet] = await getEthersSigners();
  const FORK = process.env.FORK;

  if (FORK) {
    await rawBRE.run('aave:mainnet', { skipRegistry: true });
  } else {
    console.log('-> Deploying test environment...');
    await buildTestEnv(deployer, secondaryWallet);
  }

  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
