import { generate } from "./combo";
import { Options } from "./combo/options";

const makeOptions = (args: string[]): Options => {
  const opts: Options = {
    debug: false
  };
  for (let i = 0; i < args.length; i++) {
    const opt = args[i];
    switch (opt) {
    case "--debug":
      opts.debug = true;
      break;
    case "--seed":
      opts.seed = args[++i];
      break;
    default:
      throw new Error(`Unknown option: ${opt}`);
    }
  }
  return opts;
};

const main = async () => {
  const opts = makeOptions(process.argv.slice(2));
  const gen = generate({
    oot: "oot",
    mm: "mm",
    opts
  });
  await gen.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
