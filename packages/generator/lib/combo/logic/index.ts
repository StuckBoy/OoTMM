import crypto from 'crypto';

import { Random } from '../random';
import { LogicPassSolver } from './solve';
import { LogicPassWorld } from './world';
import { LogicPassSpoiler } from './spoiler';
import { Options } from '../options';
import { LogicPassHints } from './hints';
import { LogicPassAnalysis } from './analysis';
import { Monitor } from '@ootmm/core/src/monitor';
import { LogicPassEntrances } from './entrance';
import { LogicPassHash } from './hash';
import { LogicPassConfig } from './config';
import { LogicPassWorldTransform } from './world-transform';
import { LogicPassFixer } from './fixer';
import { LogicPassAnalysisFoolish } from './analysis-foolish';
import { LogicPassPrice } from './price';

interface LogicPass<Out> {
  run: () => Out;
}

type LogicPassConstructor<In, Out> = new (state: In) => LogicPass<Out>;

class LogicPipeline<State> {
  constructor(private readonly state: State) {
  }

  apply<Out>(pass: LogicPassConstructor<State, Out>): LogicPipeline<State & Out> {
    const passInstance = new pass(this.state);
    const newState = { ...this.state, ...passInstance.run() };
    return new LogicPipeline(newState);
  }

  exec(): State {
    return this.state;
  }
};

function pipeline<State>(state: State): LogicPipeline<State> {
  return new LogicPipeline(state);
}

export const worldState = (monitor: Monitor, opts: Options) => {
  const random = new Random();
  random.seed(opts.seed + opts.settings.generateSpoilerLog);
  const state = { monitor, opts, settings: opts.settings, random, attempts: 0 };

  return pipeline(state)
    .apply(LogicPassConfig)
    .apply(LogicPassWorld)
    .apply(LogicPassFixer)
    .apply(LogicPassWorldTransform)
    .exec();
};

export const solvedWorldState = (monitor: Monitor, opts: Options) => {
  let state = worldState(monitor, opts);
  return pipeline(state)
    .apply(LogicPassPrice)
    .apply(LogicPassEntrances)
    .apply(LogicPassSolver)
    .exec();
}

export const logic = (monitor: Monitor, opts: Options) => {
  const state = solvedWorldState(monitor, opts);

  const data = pipeline(state)
    .apply(LogicPassAnalysis)
    .apply(LogicPassAnalysisFoolish)
    .apply(LogicPassHints)
    .apply(LogicPassSpoiler)
    .apply(LogicPassHash)
    .exec();

    const uuid = crypto.randomBytes(16);

    return { ...data, uuid };
};

export type LogicResult = ReturnType<typeof logic>;
