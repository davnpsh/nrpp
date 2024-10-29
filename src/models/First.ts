import Grammar from "./Grammar.ts";
import { Body } from "../types/index.ts";

export default class First {
  private data: Map<string, Set<string>> = new Map();

  constructor(grammar: Grammar) {
    // Generate data
    this.generate(grammar);
  }

  /**
   * Add elements to first of A
   * @param non_terminal - Non-terminal symbol
   * @param set - Set of new terminals
   */
  private add(non_terminal: string, set: Set<string>): void {
    // Get or create a set for first
    const existing_set = this.data.get(non_terminal) || new Set<string>();
    // Expand with new set
    this.data.set(non_terminal, new Set([...existing_set, ...set]));
  }

  /**
   * @param non_terminal - Non-terminal to look for
   * @returns Set of first of non-terminal
   */
  public get(non_terminal: string): Set<string> {
    const set = this.data.get(non_terminal);

    if (!set) throw new Error(`Non-terminal '${non_terminal}' not found.`);

    return set;
  }

  /**
   * Generate first of each non-terminal from a grammar
   * @param grammar - Context Free Grammar
   */
  private generate(grammar: Grammar): void {
    //function _symbnol

    // Recursive function to find first given a production body
    function _first(body: Body): Set<string> {
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
            rfirst = new Set([...rfirst, ..._first(body)]);
          }

          first = new Set([...first, ...rfirst]);

          // Recursive call could not be empty, return
          if (!rfirst.has("&")) return first;
        }
      }

      // All production symbols could be empty
      return first;
    }

    grammar.Productions.forEach((bodies, header) => {
      let first: Set<string> = new Set();

      bodies.forEach((body) => {
        first = new Set([...first, ..._first(body)]);
      });

      this.add(header, first);
    });
  }

  /**
   * Prints the table
   */
  public print(): void {
    // Format data
    const table_data = Array.from(this.data.entries()).map(([key, value]) => ({
      non_terminal: key,
      prim: value,
    }));

    console.table(table_data);
  }
}
