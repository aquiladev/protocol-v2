import { eAuroraNetwork, IAuroraConfiguration } from '../../helpers/types';

import { CommonsConfig } from './commons';
import {
  strategyDAI,
  strategyUSDC,
  strategyUSDT,
  strategyWBTC,
  strategyWETH,
} from './reservesConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const AuroraConfig: IAuroraConfiguration = {
  ...CommonsConfig,
  MarketId: 'Aurora market',
  ProviderId: 10,
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    WBTC: strategyWBTC,
    WETH: strategyWETH,
  },
  ReserveAssets: {
    [eAuroraNetwork.aurora]: {
      DAI: '',
      USDC: '',
      USDT: '',
      WBTC: '',
      WETH: '',
    },
    [eAuroraNetwork.auroraTestnet]: {
      DAI: '0xC684b5d930701c98A0931c277Cc8ea4B4A757710',
      USDC: '0x721C89bAeB2dAF1952beDE3EAFaEB2D9B90dD79D',
      USDT: '0x808DA456F85add06bDDFDB8bd8E94FDE4386c52a',
      WBTC: '0x001509387E77F5e3294F6e7A404c34Ca1a644ce5',
      WETH: '0xE338ac4165EEC2256ab7b5961adB2eEd50C8D965',
    },
  },
};

export default AuroraConfig;
