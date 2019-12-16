import { ThrowReporter } from "io-ts/lib/ThrowReporter";
import { Decoder } from "io-ts";

export const getCurrentTimeInSeconds = (): number =>
  Math.floor(Date.now() / 1000)

export function validateProperties<I,A>(options: I, decoder: Decoder<I,A>) {
  ThrowReporter.report(decoder.decode(options))
}
