import BigNumber from 'bignumber.js';
import {
  oneEther,
  oneRay,
  RAY,
  ZERO_ADDRESS,
  MOCK_CHAINLINK_AGGREGATORS_PRICES,
  oneUsd,
} from '../../helpers/constants';
import { ICommonConfiguration, eAuroraNetwork } from '../../helpers/types';

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: 'Commons',
  ATokenNamePrefix: 'Aave Aurora Market',
  StableDebtTokenNamePrefix: 'Aave Aurora Market stable debt',
  VariableDebtTokenNamePrefix: 'Aave Aurora Market variable debt',
  SymbolPrefix: 'v',
  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: 'USD',
  OracleQuoteUnit: oneUsd.toString(),
  ProtocolGlobalParams: {
    TokenDistributorPercentageBase: '10000',
    MockUsdPriceInWei: '5848466240000000',
    UsdAddress: '0x10F7Fc1F91Ba351f9C629c5947AD69bD03C05b96', // TODO: what is this?
    NilAddress: '0x0000000000000000000000000000000000000000',
    OneAddress: '0x0000000000000000000000000000000000000001',
    AaveReferral: '0',
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    AllAssetsInitialPrices: {
      ...MOCK_CHAINLINK_AGGREGATORS_PRICES,
    },
  },
  // TODO: reorg alphabetically, checking the reason of tests failing
  LendingRateOracleRatesCommon: {
    WETH: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    DAI: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    USDC: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    USDT: {
      borrowRate: oneRay.multipliedBy(0.035).toFixed(),
    },
    AAVE: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WBTC: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
  },
  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eAuroraNetwork.aurora]: undefined,
    [eAuroraNetwork.auroraTestnet]: undefined,
  },
  PoolAdminIndex: 0,
  EmergencyAdminIndex: 0,
  EmergencyAdmin: {
    [eAuroraNetwork.aurora]: undefined,
    [eAuroraNetwork.auroraTestnet]: undefined,
  },
  ProviderRegistry: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  ProviderRegistryOwner: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  LendingRateOracle: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  LendingPoolCollateralManager: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  LendingPoolConfigurator: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  LendingPool: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  WethGateway: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  TokenDistributor: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  AaveOracle: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  FallbackOracle: {
    [eAuroraNetwork.aurora]: ZERO_ADDRESS,
    [eAuroraNetwork.auroraTestnet]: ZERO_ADDRESS,
  },
  ChainlinkAggregator: {
    [eAuroraNetwork.aurora]: {
      DAI: '',
      USDC: '',
      USDT: '',
      WBTC: '',
    },
    [eAuroraNetwork.auroraTestnet]: {
      DAI: '0x2a3bb4ffbFcb6C7316b3a9bfb8Ac4CEFE5bfc6a6',
      USDC: '0xF0935caaF5FE7f7D5a295Ea3c015e79E1f929b4E',
      USDT: '0xB39708cadB18324f08e012CB1f017862c5afA2D0',
      WBTC: '0x805215466b012Eb1a5721a22Be2AD5f250beff8a',
      WETH: '0x842AF8074Fa41583E3720821cF1435049cf93565',
    },
  },
  ReserveAssets: {
    [eAuroraNetwork.aurora]: {},
    [eAuroraNetwork.auroraTestnet]: {},
  },
  ReservesConfig: {},
  ATokenDomainSeparator: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  WETH: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  WrappedNativeToken: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  ReserveFactorTreasuryAddress: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
  IncentivesController: {
    [eAuroraNetwork.aurora]: '',
    [eAuroraNetwork.auroraTestnet]: '',
  },
};
