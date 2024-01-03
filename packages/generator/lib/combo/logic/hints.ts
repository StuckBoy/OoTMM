import { DUNGEONS_REGIONS, World } from './world';
import { Analysis } from './analysis';
import { Random, sample, shuffle, randomInt } from '../random';
import { Settings } from '../settings';
import { Game } from '@ootmm/core/src/config';
import { Monitor } from '@ootmm/core/src/monitor';
import { Pathfinder } from './pathfind';
import { ItemPlacement } from './solve';
import { Location, locationData, makeLocation } from './locations';
import { Region, makeRegion } from './regions';
import { CountMap, countMapArray } from '../util';
import { ItemGroups, ItemHelpers, Items, PlayerItems, PlayerItem, itemByID, makePlayerItem } from '../items';
import { isDungeonStrayFairy } from '../items/helpers';

const FIXED_HINTS_LOCATIONS = [
  'OOT Skulltula House 10 Tokens',
  'OOT Skulltula House 20 Tokens',
  'OOT Skulltula House 30 Tokens',
  'OOT Skulltula House 40 Tokens',
  'OOT Skulltula House 50 Tokens',
  'OOT Hyrule Field Ocarina of Time',
  'OOT Hyrule Field Song of Time',
  'MM Laboratory Zora Song',
  'MM Moon Fierce Deity Mask',
  'MM Woodfall Great Fairy',
  'MM Snowhead Great Fairy',
  'MM Great Bay Great Fairy',
  'MM Ikana Great Fairy',
  'MM Goron Powder Keg',
  'MM Waterfall Rapids Beaver Race 1',
  'MM Waterfall Rapids Beaver Race 2',
  'MM Swamp Spider House Mask of Truth',
  'MM Ocean Spider House Wallet',
  'MM Clock Town Great Fairy',
  'MM Clock Town Great Fairy Alt',
];

const HINTS_ITEMS_ALWAYS = [
  'OOT_FROGS_FINAL',
  'MM_RANCH_DEFENSE',
  'MM_BUTLER_RACE',
  'MM_COUPLE_MASK',
  'MM_DON_GERO_CHOIR',
  'MM_GORON_RACE',
  'MM_GRAVEYARD_NIGHT3',
  'MM_SONGS_GOSSIPS',
];

const HINTS_ITEMS_SOMETIMES = [
  'OOT_FISHING',
  'OOT_RAVAGED_VILLAGE',
  'OOT_ZORA_KING',
  'OOT_GANON_FAIRY',
  'OOT_TEMPLE_FIRE_HAMMER',
  'OOT_TEMPLE_FIRE_SCARECROW',
  'OOT_GTG_WATER',
  'OOT_HAUNTED_WASTELAND',
  'OOT_GERUDO_ARCHERY',
  'OOT_BIGGORON',
  'OOT_ICE_CAVERN_CHEST',
  'OOT_TREASURE_GAME',
  'OOT_SHOOT_SUN',
  'OOT_FOREST_FLOORMASTER',
  'OOT_SHADOW_SKULL_POT',
  'OOT_MQ_SHADOW_STALFOS',
  'OOT_WATER_RIVER',
  'OOT_LOST_WOODS_TRADE',
  'OOT_JABU_RANG',
  'OOT_MQ_SPIRIT_SYMPHONY',
  'OOT_MQ_DEKU_TIME_BLOCK',
  'MM_BANK_3',
  'MM_SOUND_CHECK',
  'MM_BOAT_ARCHERY',
  'MM_OSH_CHEST',
  'MM_PINNACLE_ROCK_HP',
  'MM_FISHERMAN_GAME',
  'MM_SONG_ELEGY',
  'MM_SECRET_SHRINE_WART_HP',
  'MM_BLACKSMITH',
  'MM_MIDNIGHT_MEETING',
  'MM_MADAME_AROMA_BAR',
  'MM_CUCCOS',
  'MM_KAFEI',
  'MM_INVISIBLE_SOLDIER',
  'MM_GBT_ICE_ARROW',
  'MM_SHT_BOSS_KEY',
  'MM_WFT_BOSS_KEY',
  'MM_ISTT_BOSS_KEY',
  'MM_HUNGRY_GORON',
  'MM_KAMARO'
];

export const HINTS_PATHS = {
  woth: { id: 0, name: "Way of the Hero" },
  triforcePower: { id: 1, name: "Path of Power" },
  triforceCourage: { id: 2, name: "Path of Courage" },
  triforceWisdom: { id: 3, name: "Path of Wisdom" },
};

export type HintPath = keyof typeof HINTS_PATHS;

export type HintGossipPath = {
  type: 'path',
  region: Region,
  location: Location;
  path: HintPath;
};

export type HintGossipFoolish = {
  type: 'foolish',
  region: Region,
};

export type HintGossipItemExact = {
  type: 'item-exact';
  check: string;
  world: number;
  items: PlayerItem[];
  importances: number[];
};

export type HintGossipItemRegion = {
  type: 'item-region',
  region: Region,
  item: PlayerItem;
  importance: number;
};

export type HintGossipJunk = {
  type: 'junk';
  id: number;
};

export type HintGossip = { game: Game } & (HintGossipPath | HintGossipFoolish | HintGossipItemExact | HintGossipItemRegion | HintGossipJunk);

type WorldItemHints = {
  dungeonRewards: Region[];
  lightArrow: Region;
  oathToOrder: Region;
  ganonBossKey: Region;
  staticHintsImportances: number[];
};

export type WorldHints = WorldItemHints & {
  foolish: CountMap<string>;
  gossip: {[k: string]: HintGossip};
};

export type Hints = WorldHints[];

export type HintClass = 'path' | 'item' | 'location';

export class LogicPassHints {
  private hintedLocations = new Set<Location>();
  private stronglyHintedLocations = new Set<Location>();
  private gossip: {[k: string]: HintGossip}[];
  private woth: Set<Location>;
  private pathfinder: Pathfinder;
  private hintsAlways: string[];
  private hintsSometimes: string[];
  private ignoredRegions: Set<Region>;

  constructor(
    private readonly state: {
      monitor: Monitor;
      random: Random;
      settings: Settings;
      worlds: World[];
      items: ItemPlacement;
      analysis: Analysis;
      fixedLocations: Set<Location>;
      startingItems: PlayerItems;
    },
  ){
    this.ignoredRegions = new Set;
    for (let worldId = 0; worldId < this.state.worlds.length; ++worldId) {
      const world = this.state.worlds[worldId];
      for (const dungeon of world.preCompleted) {
        const rawRegion = DUNGEONS_REGIONS[dungeon];
        if (!rawRegion)
          continue;
        const region = makeRegion(rawRegion, worldId);
        this.ignoredRegions.add(region);
      }
      if (world.preCompleted.has('ST')) {
        this.ignoredRegions.add(makeRegion('IST', worldId));
      }
      if (world.preCompleted.has('BtW')) {
        this.ignoredRegions.add(makeRegion('BtWE', worldId));
      }
    }

    this.hintsAlways = this.alwaysHints();
    this.hintsSometimes = this.sometimesHints();
    this.pathfinder = new Pathfinder(state.worlds, state.settings, state.startingItems);
    this.woth = new Set(Array.from(this.state.analysis.required).filter(loc => this.isLocationHintable(loc, 'path')));
    this.gossip = Array.from({ length: this.state.settings.players }).map(_ => ({}));
  }

  private alwaysHints() {
    const { settings } = this.state;
    const alwaysHints = [...HINTS_ITEMS_ALWAYS];

    if (settings.cowShuffleOot) {
      alwaysHints.push('OOT_COW_LINK');
    }

    return alwaysHints;
  }

  private sometimesHints() {
    const { settings } = this.state;
    const sometimesHints = [...HINTS_ITEMS_SOMETIMES];

    if (settings.cowShuffleMm) {
      sometimesHints.push('MM_COW_WELL');
    }

    if (settings.scrubShuffleOot) {
      sometimesHints.push('OOT_DMC_SCRUB');
    }

    if (settings.goldSkulltulaTokens === 'dungeons' || settings.goldSkulltulaTokens === 'all') {
      sometimesHints.push('OOT_DEKU_BACK_SKULL');
    }

    if (settings.strayFairyChestShuffle === 'starting' || settings.strayFairyChestShuffle === 'anywhere') {
      sometimesHints.push('MM_WFT_DARK');
    }

    return sometimesHints;
  }

  private findItems(item: PlayerItem) {
    const locs: Location[] = [];

    for (const sphere of this.state.analysis.spheres) {
      for (const loc of sphere) {
        if (this.state.items.get(loc) === item) {
          locs.push(loc);
        }
      }
    }

    for (const loc of this.state.items.keys()) {
      if (this.state.items.get(loc) === item) {
        locs.push(loc);
      }
    }

    return [...new Set(locs)];
  }

  private findItem(item: PlayerItem) {
    const items = this.findItems(item);
    if (items.length === 0) {
      return null;
    }
    return items[0];
  }

  private toRegion(world: number, loc: Location | null) {
    if (loc === null) {
      return makeRegion('NONE', world);
    }
    const locD = locationData(loc);
    return makeRegion(this.state.worlds[locD.world as number].regions[locD.id], locD.world as number);
  }

  private isLocationHintable(loc: Location, klass: HintClass) {
    /* Get the item and region  */
    const item = this.state.items.get(loc)!;
    const locD = locationData(loc);
    const world = this.state.worlds[locD.world as number];
    const region = world.regions[locD.id];
    const playerRegion = makeRegion(region, locD.world as number);

    /* Ignored region */
    if (this.ignoredRegions.has(playerRegion)) {
      return false;
    }

    /* No plando */
    if (this.state.settings.noPlandoHints) {
      if (this.state.settings.plando.locations[locD.id]) {
        return false;
      }
    }

    /* These specific locations are always ignored */
    if (['OOT Temple of Time Medallion', 'MM Oath to Order', 'OOT Hatch Chicken', 'OOT Hatch Pocket Cucco'].includes(locD.id)) {
      return false;
    }

    /* Non-shuffled items are ignored */
    if (this.state.fixedLocations.has(loc)) {
      return false;
    }

    /* CHecks with no region are ignored (skip zelda) */
    if (!region || region === 'NONE') {
      return false;
    }

    /* Non-shuffled hideout keys */
    if ((ItemHelpers.isSmallKeyHideout(item.item) || ItemHelpers.isKeyRingHideout(item.item)) && this.state.settings.smallKeyShuffleHideout !== 'anywhere') {
      return false;
    }

    /* Non-shuffled TCG keys */
    if ((ItemHelpers.isSmallKeyTCG(item.item) || ItemHelpers.isKeyRingTCG(item.item)) && this.state.settings.smallKeyShuffleChestGame !== 'anywhere') {
      return false;
    }

    /* Non-shuffled regular keys */
    if ((ItemHelpers.isSmallKeyRegularOot(item.item) || ItemHelpers.isKeyRingRegularOot(item.item)) && this.state.settings.smallKeyShuffleOot !== 'anywhere') {
      return false;
    }
    if ((ItemHelpers.isSmallKeyRegularMm(item.item) || ItemHelpers.isKeyRingRegularMm(item.item)) && this.state.settings.smallKeyShuffleMm !== 'anywhere') {
      return false;
    }

    /* Non-shuffled silver rupees */
    if (ItemHelpers.isSilverRupee(item.item) && this.state.settings.silverRupeeShuffle !== 'anywhere') {
      return false;
    }

    /* Non-shuffled Ganon BK (doesn't really matter) */
    if (ItemHelpers.isGanonBossKey(item.item) && this.state.settings.ganonBossKey !== 'anywhere') {
      return false;
    }

    /* Non shuffled boss keys */
    if (ItemHelpers.isRegularBossKeyOot(item.item) && this.state.settings.bossKeyShuffleOot !== 'anywhere') {
      return false;
    }

    if (ItemHelpers.isRegularBossKeyMm(item.item) && this.state.settings.bossKeyShuffleMm !== 'anywhere') {
      return false;
    }

    /* Non shuffled town fairy */
    if (ItemHelpers.isTownStrayFairy(item.item) && this.state.settings.townFairyShuffle === 'vanilla') {
      return false;
    }

    /* Non shuffled dungeon stray fairy */
    if (isDungeonStrayFairy(item.item) && this.state.settings.strayFairyChestShuffle !== 'anywhere' && this.state.settings.strayFairyOtherShuffle !== 'anywhere') {
      return false;
    }

    /* Non-shuffled map/compass (doesn't really matter) */
    if (ItemHelpers.isMapCompass(item.item) && this.state.settings.mapCompassShuffle !== 'anywhere') {
      return false;
    }

    /* Non-shuffled dungeon reward */
    if (ItemHelpers.isDungeonReward(item.item) && this.state.settings.dungeonRewardShuffle === 'dungeonBlueWarps') {
      return false;
    }

    /* Non shuffled GS token */
    /* TODO: Handle dungeon/overworld better */
    if (ItemHelpers.isGoldToken(item.item) && this.state.settings.goldSkulltulaTokens === 'none') {
      return false;
    }

    /* Non shuffled House tokens */
    if (ItemHelpers.isHouseToken(item.item) && this.state.settings.housesSkulltulaTokens === 'none') {
      return false;
    }

    /* Triforce Piece - never hinted outside of location */
    if (ItemHelpers.isTriforcePiece(item.item) && klass !== 'location') {
      return false;
    }

    /* Additional restrictions for WotH */
    if (klass === 'path') {
      if (ItemHelpers.isKey(item.item) || ItemHelpers.isStrayFairy(item.item) || ItemHelpers.isSilverRupee(item.item) || ItemHelpers.isToken(item.item) || ItemHelpers.isDungeonReward(item.item)) {
        return false;
      }
      if (ItemHelpers.isSong(item.item) && this.state.settings.songs !== 'anywhere') {
        return false;
      }
    }

    return true;
  }

  private findValidGossip(world: number, locs: Set<Location> | Location) {
    if (typeof locs === 'string') {
      locs = new Set([locs]);
    }
    const pathfinderState = this.pathfinder.run(null, { gossips: true, recursive: true, items: this.state.items, forbiddenLocations: locs });
    const gossips = Array.from(pathfinderState.gossips[world]).filter(x => ['gossip', 'gossip-grotto'].includes(this.state.worlds[world].gossip[x].type)).filter(x => !this.gossip[world][x]);
    if (gossips.length === 0) {
      return null;
    }
    return sample(this.state.random, gossips);
  }

  private playthroughLocations(player: number) {
    const locations = this.state.analysis.spheres.flat()
      .filter(loc => this.state.items.get(loc)!.player === player)
      .filter(loc => this.isLocationHintable(loc, 'item'));
    return shuffle(this.state.random, locations);
  }

  private locationFoolish(loc: Location) {
    if (!this.isLocationHintable(loc, 'location') || this.state.analysis.unreachable.has(loc)) {
      return 0;
    }
    if (!this.state.analysis.useless.has(loc)) {
      return -1;
    }
    if (this.hintedLocations.has(loc) || this.state.settings.junkLocations.includes(locationData(loc).id)) {
      return 0;
    }
    return 1;
  }

  private foolishRegions(worldId: number) {
    let regions: CountMap<string> = new Map;
    const world = this.state.worlds[worldId];

    for (const locationId in world.checks) {
      const location = makeLocation(locationId, worldId);
      const region = world.regions[locationId];
      if (!regions.has(region)) {
        regions.set(region, 0);
      }
      const prev = regions.get(region)!;
      if (prev === -1) {
        continue;
      }
      const value = this.locationFoolish(location);
      if (value === -1) {
        regions.set(region, -1);
      } else {
        regions.set(region, prev + value);
      }
    }

    for (const r of regions.keys()) {
      const playerRegion = makeRegion(r, worldId);
      if (this.ignoredRegions.has(playerRegion) || (regions.get(r)! <= 0)) {
        regions.delete(r);
      }
    }

    return regions;
  }

  private locImportance(loc: Location) {
    const pi = this.state.items.get(loc)!;
    if (!ItemHelpers.isItemMajor(pi.item)) {
      return -1;
    }

    if (this.state.analysis.unreachable.has(loc) || this.state.analysis.useless.has(loc)) {
      return 0;
    }

    if (this.state.analysis.required.has(loc)) {
      return 2;
    }

    return 1;
  }

  private placeGossipItemExact(worldId: number, checkWorldId: number, checkHint: string, extra: number, isMoon: boolean) {
    if (checkHint === 'NONE') {
      return false;
    }
    const world = this.state.worlds[worldId];
    const checkWorld = this.state.worlds[checkWorldId];
    const locations = (checkWorld.checkHints[checkHint] || []).map(x => makeLocation(x, checkWorldId));
    if (locations.every(l => this.hintedLocations.has(l)) || locations.some(l => this.stronglyHintedLocations.has(l))) {
      return false;
    }
    const items = locations.map(l => this.state.items.get(l)!);
    const regions = locations.map(l => this.toRegion(worldId, l));
    if (regions.some(r => this.ignoredRegions.has(r))) {
      return false;
    }
    let gossip;
    if (isMoon) {
      const candidates = Object.keys(world.gossip)
        .filter(x => world.gossip[x].type === 'gossip-moon')
        .filter(x => !this.gossip[worldId][x]);
      if (candidates.length === 0)
        return false;
      gossip = sample(this.state.random, candidates);
    } else {
      gossip = this.findValidGossip(worldId, new Set(locations));
    }
    if (!gossip) {
      return false;
    }
    const importances = locations.map(l => this.locImportance(l));

    /* Found a valid gossip */
    for (const l of locations) {
      this.hintedLocations.add(l);
    }
    const hint: HintGossip = { game: world.gossip[gossip].game, type: 'item-exact', items, importances, check: checkHint, world: checkWorldId };
    this.placeWithExtra(worldId, gossip, hint, extra);
    return true;
  }

  private placeGossipItemExactPool(worldId: number, pool: string[], count: number | 'max', extra: number) {
    const world = this.state.worlds[worldId];
    if (count === 'max') {
      count = pool.length;
    }
    let placed = 0;
    pool = shuffle(this.state.random, pool);
    for (const checkHint of pool) {
      if (placed >= count) {
        break;
      }
      const locations = (world.checkHints[checkHint] || []).map(x => makeLocation(x, worldId));
      if (!locations) {
        continue;
      }
      if (locations.every(l => this.state.settings.junkLocations.includes(locationData(l).id))) {
        continue;
      }
      if (this.placeGossipItemExact(worldId, worldId, checkHint, extra, false)) {
        placed++;
      }
    }
    return placed;
  }

  private placeGossipFoolish(worldId: number, regions: CountMap<string>, count: number | 'max', extra: number) {
    const world = this.state.worlds[worldId];
    if (count === 'max') {
      count = 999;
    }
    let placed = 0;
    regions = new Map(regions);
    while (placed < count) {
      const regionsArray = countMapArray(regions);
      if (regionsArray.length === 0) {
        break;
      }
      const region = sample(this.state.random, regionsArray);
      regions.delete(region);
      const gossips = Object.keys(world.gossip)
        .filter(x => !this.gossip[worldId][x])
        .filter(x => ['gossip', 'gossip-grotto'].includes(world.gossip[x].type));
      if (gossips.length === 0)
        break;
      const gossip = sample(this.state.random, gossips);

      /* Found a gossip */
      for (const locId in world.checks) {
        const loc = makeLocation(locId, worldId);
        if (world.regions[locId] === region) {
          this.hintedLocations.add(loc);
        }
      }

      const hint: HintGossip = { game: world.gossip[gossip].game, type: 'foolish', region: makeRegion(region, worldId) };
      this.placeWithExtra(worldId, gossip, hint, extra);

      placed++;
    }
    return placed;
  }

  private placePaths(worldId: number, count: number | 'max', extra: number) {
    if (count === 'max') {
      count = 999;
    }
    let placed = 0;
    let tmp: number;
    tmp = this.placePathsNamedTriforce(worldId, count, extra);
    placed += tmp;
    count -= tmp;
    tmp = this.placePathWoth(worldId, count, extra);
    placed += tmp;
    count -= tmp;

    return placed;
  }

  private placePathsNamedTriforce(worldId: number, count: number, extra: number) {
    if (this.state.settings.goal !== 'triforce3') {
      return 0;
    }
    const paths = ['triforcePower', 'triforceCourage', 'triforceWisdom'] as const;
    const mapPaths = new Map<Location, Set<HintPath>>;
    let locations: Location[] = [];
    const world = this.state.worlds[worldId];

    for (const p of paths) {
      const pp = this.state.analysis.paths[p];
      for (const loc of pp) {
        if (this.hintedLocations.has(loc) || !this.isLocationHintable(loc, 'path')) {
          continue;
        }
        const s = mapPaths.get(loc) || new Set;
        s.add(p);
        mapPaths.set(loc, s);
        locations.push(loc);
      }
    }
    locations = shuffle(this.state.random, locations);

    let placed = 0;
    for (;;) {
      locations = locations.filter(x => !this.hintedLocations.has(x));
      if (placed >= count || locations.length === 0)
        break;
      const loc = locations.pop()!;
      const gossip = this.findValidGossip(worldId, loc);
      if (gossip !== null) {
        const locD = locationData(loc);
        this.hintedLocations.add(loc);
        this.stronglyHintedLocations.add(loc);
        const paths = mapPaths.get(loc)!;
        const path = sample(this.state.random, Array.from(paths));
        const hint: HintGossip = { game: world.gossip[gossip].game, type: 'path', path, region: makeRegion(world.regions[locD.id], locD.world as number), location: loc };
        this.placeWithExtra(worldId, gossip, hint, extra);
        placed++;
      }
    }
    return placed;
  }

  private placePathWoth(worldId: number, count: number, extra: number) {
    const world = this.state.worlds[worldId];
    let placed = 0;
    const locs = shuffle(this.state.random, Array.from(this.woth)
      .filter(loc => locationData(loc).world === worldId)
      .filter(loc => !this.hintedLocations.has(loc)));

    for (;;) {
      if (placed >= count || locs.length === 0) {
        break;
      }
      const loc = locs.pop()!;
      const gossip = this.findValidGossip(worldId, loc);
      if (gossip !== null) {
        const locD = locationData(loc);
        this.hintedLocations.add(loc);
        this.stronglyHintedLocations.add(loc);
        const hint: HintGossip = { game: world.gossip[gossip].game, type: 'path', path: 'woth', region: makeRegion(world.regions[locD.id], locD.world as number), location: loc };
        this.placeWithExtra(worldId, gossip, hint, extra);
        placed++;
      }
    }
    return placed;
  }

  private placeGossipJunk(worldId: number, count: number | 'max', extra: number, moon: boolean) {
    const world = this.state.worlds[worldId];
    if (count === 'max') {
      count = 999;
    }
    let placed = 0;
    let gossips = Object.keys(world.gossip)
      .filter(x => !this.gossip[worldId][x]);
    if (!moon) {
      gossips = gossips.filter(x => ['gossip', 'gossip-grotto'].includes(world.gossip[x].type));
    }
    gossips = shuffle(this.state.random, gossips);
    for (;;) {
      if (placed >= count || gossips.length === 0) {
        break;
      }
      const gossip = gossips.pop()!;
      const id = randomInt(this.state.random, 65536);
      const hint: HintGossip = { game: world.gossip[gossip].game, type: 'junk', id };
      this.placeWithExtra(worldId, gossip, hint, extra);
      placed++;
    }
    return placed;
  }

  private placeGossipItemRegion(worldId: number, location: Location | null, extra: number, isMoon: boolean) {
    const world = this.state.worlds[worldId];
    if (location === null) {
      return false;
    }
    const locD = locationData(location);
    const locWorld = this.state.worlds[locD.world as number];
    if (this.hintedLocations.has(location) && !isMoon) {
      return false;
    }
    const item = this.state.items.get(location)!;
    const hint = locWorld.checks[locD.id].hint;
    if (this.placeGossipItemExact(worldId, locD.world as number, hint, extra, isMoon)) {
      return true;
    }
    let gossip;
    if (isMoon) {
      const candidates = Object.keys(world.gossip)
        .filter(x => world.gossip[x].type === 'gossip-moon')
        .filter(x => !this.gossip[worldId][x]);
      if (candidates.length === 0)
        return false;
      gossip = sample(this.state.random, candidates);
    } else {
      gossip = this.findValidGossip(worldId, location);
    }
    if (gossip === null) {
      return false;
    }
    this.hintedLocations.add(location);
    const importance = this.locImportance(location);
    const h: HintGossip = { game: world.gossip[gossip].game, type: 'item-region', item, importance, region: makeRegion(locWorld.regions[locD.id], locD.world as number) };
    this.placeWithExtra(worldId, gossip, h, extra);
    return true;
  }

  private placeGossipItemName(world: number, itemId: string, count: number | 'max', extra: number) {
    const item = itemByID(itemId);
    const playerItem = makePlayerItem(item, world);
    const locations = this.findItems(playerItem);
    if (count === 'max') {
      count = locations.length;
    }
    let placed = 0;
    for (let i = 0; i < locations.length; ++i) {
      if (placed >= count)
        break;
      const loc = locations[i];
      if (this.placeGossipItemRegion(world, loc, extra, false)) {
        placed++;
      }
    }
    return placed;
  }

  private placeGossipItemRegionSpheres(world: number, count: number | 'max', extra: number) {
    if (count === 'max') {
      count = 999;
    }
    const locations = this.playthroughLocations(world);
    let placed = 0;
    for (const loc of locations) {
      if (placed >= count) {
        break;
      }
      if (this.placeGossipItemRegion(world, loc, extra, false)) {
        placed++;
      }
    }
    return placed;
  }

  private place(worldId: number, loc: string, hint: HintGossip) {
    /* KLUDGE */
    if (loc.startsWith('MM ')) {
      hint.game = 'mm';
    } else {
      hint.game = 'oot';
    }
    this.gossip[worldId][loc] = { ...hint };
  }

  private placeWithExtra(worldId: number, loc: string, hint: HintGossip, extra: number) {
    const world = this.state.worlds[worldId];
    this.place(worldId, loc, hint);

    for (let i = 0; i < extra; ++i) {
      const gossips = Object.keys(world.gossip)
        .filter(x => !this.gossip[worldId][x])
        .filter(x => ['gossip', 'gossip-grotto'].includes(world.gossip[x].type));
      if (gossips.length === 0) {
        break;
      }
      const gossip = sample(this.state.random, gossips);
      this.place(worldId, gossip, hint);
    }
  }

  private placeMoonGossip(world: number) {
    for (const mask of ItemGroups.MASKS_REGULAR) {
      const location = this.findItem(makePlayerItem(mask, world));
      this.placeGossipItemRegion(world, location, 0, true);
    }
  }

  private placeGossipsJunkIgnored(worldId: number) {
    const world = this.state.worlds[worldId];
    const gossips = new Set<string>();
    for (const a of Object.keys(world.areas)) {
      const area = world.areas[a];
      const playerRegion = makeRegion(area.region, worldId);
      if (!this.ignoredRegions.has(playerRegion)) {
        continue;
      }
      for (const g of Object.keys(area.gossip)) {
        gossips.add(g);
      }
    }

    for (const g of gossips) {
      this.place(worldId, g, { game: world.gossip[g].game, type: 'junk', id: randomInt(this.state.random, 65536) });
    }
  }

  private placeGossips(foolish: CountMap<string>[]) {
    const settingsHints = this.state.settings.hints;

    for (let world = 0; world < this.state.settings.players; ++world) {
      this.placeGossipsJunkIgnored(world);
    }

    for (const s of settingsHints) {
      for (let world = 0; world < this.state.settings.players; ++world) {
        switch (s.type) {
        case 'always':
          this.placeGossipItemExactPool(world, this.hintsAlways, s.amount, s.extra);
          break;
        case 'sometimes':
          this.placeGossipItemExactPool(world, this.hintsSometimes, s.amount, s.extra);
          break;
        case 'foolish':
          this.placeGossipFoolish(world, foolish[world], s.amount, s.extra);
          break;
        case 'item':
          this.placeGossipItemName(world, s.item!, s.amount, s.extra);
          break;
        case 'playthrough':
          this.placeGossipItemRegionSpheres(world, s.amount, s.extra);
          break;
        case 'woth':
          this.placePaths(world, s.amount, s.extra);
          break;
        case 'junk':
          this.placeGossipJunk(world, s.amount, s.extra, false);
          break;
        }
      }
    }

    /* Place moon hints */
    for (let world = 0; world < this.state.settings.players; ++world)
      this.placeMoonGossip(world);

    /* Fill with junk hints */
    for (let world = 0; world < this.state.settings.players; ++world)
      this.placeGossipJunk(world, 'max', 0, true);
  }

  markLocation(location: Location | null) {
    if (location === null) {
      return;
    }
    this.hintedLocations.add(location);
  }

  run() {
    this.state.monitor.log('Logic: Hints');
    const worldFoolish: CountMap<string>[] = [];
    const worldItemHints: WorldItemHints[] = [];

    /* Mark static hints */
    for (let world = 0; world < this.state.settings.players; ++world) {
      FIXED_HINTS_LOCATIONS.forEach(x => this.hintedLocations.add(makeLocation(x, world)));
    }

    /* Compute foolish */
    for (let world = 0; world < this.state.settings.players; ++world) {
      worldFoolish.push(this.foolishRegions(world));
    }

    /* Compute item hints */
    for (let world = 0; world < this.state.settings.players; ++world) {
      const locDungeonRewards = [...ItemGroups.DUNGEON_REWARDS].map(item => this.findItem(makePlayerItem(item, world)));
      const locLightArrow = this.findItem(makePlayerItem(Items.OOT_ARROW_LIGHT, world)) || this.findItem(makePlayerItem(Items.SHARED_ARROW_LIGHT, world));
      const locOathToOrder = this.findItem(makePlayerItem(Items.MM_SONG_ORDER, world));
      const locGanonBossKey = this.state.settings.ganonBossKey === 'anywhere' ? this.findItem(makePlayerItem(Items.OOT_BOSS_KEY_GANON, world)) : null;

      /* We consider LAs hinted only if they don't lock the hint itself */
      if (locLightArrow) {
        if (this.state.settings.logic === 'none') {
          this.markLocation(locLightArrow);
        } else {
          const pathfinderStateNoLA = this.pathfinder.run(null, { recursive: true, items: this.state.items, forbiddenLocations: new Set([locLightArrow]) });
          if (pathfinderStateNoLA.ws[world].events.has('OOT_GANON_START')) {
            this.markLocation(locLightArrow);
          }
        }
      }

      for (const l of [...locDungeonRewards, locOathToOrder, locGanonBossKey]) {
        this.markLocation(l);
      }

      /* Compute static hints importance */
      const staticHintsImportances = FIXED_HINTS_LOCATIONS.map(x => this.locImportance(makeLocation(x, world)));

      worldItemHints.push({
        dungeonRewards: locDungeonRewards.map((x) => this.toRegion(world, x)),
        lightArrow: this.toRegion(world, locLightArrow),
        oathToOrder: this.toRegion(world, locOathToOrder),
        ganonBossKey: this.toRegion(world, locGanonBossKey),
        staticHintsImportances,
      });
    }

    /* Place hints */
    this.placeGossips(worldFoolish);

    /* Make hints */
    const hints: Hints = [];
    for (let world = 0; world < this.state.settings.players; ++world) {
      hints.push({ foolish: worldFoolish[world], ...worldItemHints[world], gossip: { ...this.gossip[world] }});
    }

    return { hints };
  }
}
