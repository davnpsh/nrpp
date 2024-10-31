import Grammar from "./Grammar.ts";
import Symbol from "./Symbol.ts";
import { _first } from "../lib/utils.ts";

export default class Follow {
  private data: Map<string, Set<string>> = new Map();

  constructor(grammar: Grammar) {
    // Generate data
    this.generate(grammar);
  }

  /**
   * Add elements to follow of A
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
   * @returns Set of follow of non-terminal
   */
  public get(non_terminal: string): Set<string> {
    const set = this.data.get(non_terminal);

    if (!set) throw new Error(`Non-terminal '${non_terminal}' not found.`);

    return set;
  }

  /**
   * Generate follow of each non-terminal from a grammar
   * @param grammar - Context Free Grammar
   * @param first - First of the non-terminal symbol
   */
  private generate(grammar: Grammar): void {
    // Recursive function to find follow through all productions
    function _follow(non_terminal: string): Set<string> {
      let follow: Set<string> = new Set();

      // Go through all productions
      grammar.Productions.forEach((bodies, header) => {
        bodies.forEach((body) => {
          // Look for A
          for (let i = 0; i < body.content.length; i++) {
            const symbol: Symbol = body.content[i];

            // If found
            if (symbol.text === non_terminal) {
              const beta = body.content.slice(i + 1);

              // A -> alphaB - Recursive base case
              if (beta.length === 0 && non_terminal !== header) {
                follow = new Set([...follow, ..._follow(header)]);

                // $ wildcard
                if (header === S) {
                  follow.add("$");
                }
              } else {
                // A -> alphaBbeta
                const first = _first(grammar, { content: beta });

                // Add first(beta) without & (base case)
                follow = new Set([
                  ...follow,
                  ...[...first].filter((item) => item !== "&"),
                ]);

                // Recursive case
                if (first.has("&") && non_terminal !== header) {
                  follow = new Set([...follow, ..._follow(header)]);

                  // $ wildcard
                  if (header === S) {
                    follow.add("$");
                  }
                }
              }
            }
          }
        });
      });

      return follow;
    }

    // Initial non-terminal
    const S: string = grammar.NonTerminals.get(0) as string;

    // Add $ wildcard to S
    this.add(S, new Set("$"));

    // Get follow of each non terminal
    grammar.NonTerminals.forEach((non_terminal) => {
      this.add(non_terminal, _follow(non_terminal));
    });
  }

  /**
   * Prints the table
   */
  public print(): void {
    // Format data
    const table_data = Array.from(this.data.entries()).map(([key, value]) => ({
      non_terminal: key,
      follow: value,
    }));

    console.table(table_data);
  }
}
