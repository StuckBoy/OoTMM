import path from 'path';

import DATA_FILES_OOT from '../data/oot/files.json';
import DATA_FILES_MM from '../data/mm/files.json';

export const GAMES = ['oot', 'mm'] as const;
export type Game = typeof GAMES[number];

export const ROOT = path.resolve(__dirname, '..');
export const PATH_ROMS = path.resolve(ROOT, 'roms');
export const PATH_BUILD =path.resolve(ROOT, 'build');
export const PATH_DATA = path.resolve(ROOT, 'data');
export const PATH_DIST = path.resolve(ROOT, 'dist');

export const CUSTOM_ADDR = 0x03f80000;

export const DATA_FILES = {
  oot: DATA_FILES_OOT,
  mm: DATA_FILES_MM,
};

type GameConfig = {
  sha256: readonly string[];
  dmaAddr: number;
  dmaCount: number;
  payloadAddr: number;
  actorsOvlAddr: number;
  actorsOvlCount: number;
  objectTableAddr: number;
  objectCount: number;
};

export const CONFIG_OOT: GameConfig = {
  sha256: ["d38fd6ff19daf05320b3c23f9adc119b017408686e12aaf32f313a7582b020af", "c916ab315fbe82a22169bff13d6b866e9fddc907461eb6b0a227b82acdf5b506"],
  dmaAddr: 0x7430,
  dmaCount: 1510,
  payloadAddr: 0x03fa0000,
  actorsOvlAddr: 0xb5e490,
  actorsOvlCount: 471,
  objectTableAddr: 0xb6ef58,
  objectCount: 0x192,
};

export const CONFIG_MM: GameConfig = {
  sha256: ["efb1365b3ae362604514c0f9a1a2d11f5dc8688ba5be660a37debf5e3be43f2b"],
  dmaAddr: 0x1a500,
  dmaCount: 1552,
  payloadAddr: 0x03fc0000,
  actorsOvlAddr: 0xc45510,
  actorsOvlCount: 690,
  objectTableAddr: 0xc58c80,
  objectCount: 0x283,
};

export const CONFIG = {
  oot: CONFIG_OOT,
  mm: CONFIG_MM,
};