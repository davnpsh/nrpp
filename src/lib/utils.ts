import { Body } from "../types/index.ts";
import Grammar from "../models/Grammar.ts";

/**
 * Get a set of first posible symbols of a production.
 * @param grammar - Context Free Grammar.
 * @param body - Production body.
 * @returns Set of first posible symbols of a production.
 */
export function _first(grammar: Grammar, body: Body): Set<string> {
  let first: Set<string> = new Set();

  for (const symbol of body.content) {
    if (symbol.type === "terminal") {
      // base case_) find a terminal and return it.
      first.add(symbol.text);
      return first;
    } else {
      // recursive case_) find a non-terminal and call the function again.
      let rfirst: Set<string> = new Set(); // Recursive first on call

      const bodies: Set<Body> = grammar.Productions.get(
        symbol.text
      ) as Set<Body>;

      for (const body of bodies) {
        rfirst = new Set([...rfirst, ..._first(grammar, body)]);
      }

      // Add, filtering & out
      first = new Set([
        ...first,
        ...[...rfirst].filter((item) => item !== "&"),
      ]);

      // Recursive call could not be empty, return
      if (!rfirst.has("&")) return first;
    }
  }

  // All production symbols could be empty
  first.add("&");

  return first;
}
