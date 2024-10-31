import Grammar from "./Grammar.ts";
import Follow from "./Follow.ts";
import { Body } from "../types/index.ts";
import { _first } from "../lib/utils.ts";

export default class M {
  private data: Map<string, Map<string, Body>>;
  private grammar: Grammar;

  constructor(grammar: Grammar, follow: Follow) {
    // Initialize data
    this.data = new Map();
    this.grammar = grammar;

    grammar.NonTerminals.forEach((non_terminal) => {
      // Point the non-terminal to its symbols
      // NOTE: This for order purposes only
      this.data.set(non_terminal, new Map());
    });

    this.generate(grammar, follow);
  }

  /**
   * Set a production A in M[A, symbol]
   * @param non_terminal -  Row
   * @param symbol - Column
   * @param production - Production
   */
  private set(non_terminal: string, symbol: string, production: Body) {
    // Get row of the non-terminal
    const row: Map<string, Body> = this.data.get(non_terminal) as Map<
      string,
      Body
    >;

    // Set production in the column
    row.set(symbol, production);
  }

  /**
   * Get a production A in M[A, symbol]
   * @param non_terminal -  Row
   * @param symbol - Column
   * @returns production
   */
  public get(non_terminal: string, symbol: string): Body | undefined {
    const row: Map<string, Body> = this.data.get(non_terminal) as Map<
      string,
      Body
    >;

    return row.get(symbol);
  }

  /**
   * Generate follow of each non-terminal from a grammar
   * @param grammar - Context Free Grammar
   * @param first - First of the CFG
   * @param follow - Follow of the CFG
   */
  private generate(grammar: Grammar, follow: Follow) {
    grammar.Productions.forEach((bodies, header) => {
      // For each production A
      bodies.forEach((body) => {
        // 1_)
        const first = _first(grammar, body);

        first.forEach((symbol) => {
          if (symbol === "&") return;
          this.set(header, symbol, body);
        });

        // 2_)
        if (first.has("&")) {
          follow.get(header).forEach((symbol) => {
            this.set(header, symbol, body);
          });
        }
      });
    });
  }

  /**
   * Prints the table
   */
  public print() {
    const table_data: Array<{ [key: string]: string }> = [];

    this.grammar.NonTerminals.forEach((non_terminal) => {
      const row: { [key: string]: string } = { non_terminal: non_terminal };

      this.grammar.Terminals.forEach((terminal) => {
        const production: Body | undefined = this.get(non_terminal, terminal);

        if (production) {
          row[terminal] = `${non_terminal}->${production.content
            .map((symbol) => symbol.text)
            .join("")}`;
        } else {
          row[terminal] = "";
        }
      });

      // Don't forget the $ wildcard
      const production: Body | undefined = this.get(non_terminal, "$");

      if (production) {
        row["$"] = `${non_terminal}->${production.content
          .map((symbol) => symbol.text)
          .join("")}`;
      } else {
        row["$"] = "";
      }

      table_data.push(row);
    });

    console.table(table_data);
  }
}
