import Grammar from "./Grammar.ts";
import { _first } from "../lib/utils.ts";

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
    // Respect order
    grammar.NonTerminals.forEach((non_terminal) => {
      let first: Set<string> = new Set();

      grammar.Productions.get(non_terminal)?.forEach((body) => {
        first = new Set([...first, ..._first(grammar, body)]);
      });

      this.add(non_terminal, first);
    });
  }

  /**
   * Prints the table
   */
  public print(): void {
    // Format data
    const table_data = Array.from(this.data.entries()).map(([key, value]) => ({
      non_terminal: key,
      first: value,
    }));

    console.table(table_data);
  }

  /**
   * Export to JSON format
   */
  public export(): { non_terminal: string; first: string[] }[] {
    return Array.from(this.data.entries()).map(([key, value]) => ({
      non_terminal: key,
      first: Array.from(value),
    }));
  }
}
