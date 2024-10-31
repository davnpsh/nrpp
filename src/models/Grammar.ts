import { Body } from "../types/index.ts";
import Symbol from "./Symbol.ts";
import NTSet from "./NTSet.ts";
import { _new_symbol } from "../lib/utils.ts";

export default class Grammar {
  public Productions: Map<string, Set<Body>> = new Map();
  public Terminals: Set<Symbol> = new Set();
  public NonTerminals: NTSet = new NTSet();

  // Data is content of the grammar text file
  constructor(data: string) {
    try {
      data
        // Split productions by lines
        .split("\n")
        // Filter empty lines
        .filter((line) => line.trim() !== "")
        // Add production
        .map((line) => this.add(line));
    } catch (_e) {
      throw new Error("Wrong format on text file.");
    }

    this.remove_left_recursion();
    this.factor_left();

    // Get terminal symbols at the end, because order
    // could change while removing recursion or factoring
    this.get_terminal_symbols();
  }

  /**
   * Add production.
   * @param expression - String of the form A->aB.
   */
  private add(expression: string): void {
    // Split header and body texts
    const [header_text, body_text] = expression
      .split("->")
      .map((part) => part.trim());

    // Retrieve the production header
    const production = this.Productions.get(header_text);

    // If there is no production on that header, create it
    if (!production) {
      this.Productions.set(header_text, new Set<Body>());
    }

    // Add new symbol to non-terminals set
    this.NonTerminals.add(header_text);

    // Parse body
    const body_symbols =
      body_text
        .replace(/&/g, "") // Remove all '&' characters
        .match(/[A-Z]'*|./g)
        ?.map((symbol) => new Symbol(symbol)) || [];

    if (body_text === "&") {
      body_symbols.push(new Symbol("&"));
    }

    // Check if it already exists
    const already_exists = [...this.Productions.get(header_text)!].find(
      (body) =>
        body.content.map((symbol) => symbol.text).join("") ===
        body_symbols.map((symbol) => symbol.text).join("")
    );

    if (already_exists) return;

    // If not, add new production
    this.Productions.get(header_text)?.add({ content: body_symbols });
  }

  /**
   * Get terminal symbols
   */
  private get_terminal_symbols(): void {
    const seen_terminals: Set<string> = new Set();

    // Go through productions in the order of non-terminals
    this.NonTerminals.forEach((non_terminal) => {
      // Get bodies
      this.Productions.get(non_terminal)?.forEach((body) => {
        for (const symbol of body.content) {
          if (!seen_terminals.has(symbol.text) && symbol.type === "terminal") {
            seen_terminals.add(symbol.text);
            this.Terminals.add(symbol);
          }
        }
      });
    });
  }

  /**
   * Remove all left recursion on the productions.
   * This is based on the algorithm provided in https://en.m.wikipedia.org/wiki/Left_recursion
   */
  private remove_left_recursion(): void {
    // For each terminal A_i:
    this.Productions.forEach((bodies, header) => {
      // Remove direct left recursion for A_i
      let recursion: boolean = false;

      // 1_) Get alpha and beta for A -> Aalpha|beta
      const alpha: Set<Symbol[]> = new Set();
      const beta: Set<Symbol[]> = new Set();

      bodies.forEach((body) => {
        // Direct recursion
        if (header === body.content[0].text) {
          recursion = true;

          // 1_a) alpha
          alpha.add(body.content.slice(1));
        } else {
          // 1_b) beta
          beta.add(body.content.slice(0));
        }
      });

      if (!recursion) return;

      // 2_) Delete old productions
      this.Productions.get(header)?.clear();

      // 3_) Create new productions
      // 3_b) beta
      if (beta.size === 0) {
        this.add(`${header}->${header}'`);
      }
      beta.forEach((_beta: Symbol[]) => {
        this.add(
          `${header}->${_beta.map((symbol) => symbol.text).join("")}${header}'`
        );
      });
      // 3_a) alpha
      alpha.forEach((_alpha: Symbol[]) => {
        this.add(
          `${header}'->${_alpha
            .map((symbol) => symbol.text)
            .join("")}${header}'`
        );
      });

      // 4_) Add epsilon production
      this.add(`${header}'->&`);
    });
  }

  /**
   * Apply left factoring
   */
  private factor_left(): void {
    /**
     * @param bodies - Production bodies
     * @returns [common_prefix, factored_bodies, untouched_bodies]
     */
    function _factor(bodies: string[]): [string | null, string[], string[]] {
      const prefixMap: { [key: string]: string[] } = {};

      // Find common prefix between 2 strings
      const find_common_prefix = (str1: string, str2: string): string => {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
          i++;
        }
        return str1.substring(0, i);
      };

      // Iterate through the bodies and group strings by their common prefixes
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const prefix = find_common_prefix(bodies[i], bodies[j]);
          if (prefix) {
            if (!prefixMap[prefix]) {
              prefixMap[prefix] = [];
            }
            if (!prefixMap[prefix].includes(bodies[i])) {
              prefixMap[prefix].push(bodies[i]);
            }
            if (!prefixMap[prefix].includes(bodies[j])) {
              prefixMap[prefix].push(bodies[j]);
            }
          }
        }
      }

      // Find the first occurrence of matches
      for (const key in prefixMap) {
        if (prefixMap[key].length > 1) {
          const common_prefix = key;
          const factored_bodies = prefixMap[key].map((str) =>
            str.substring(common_prefix.length)
          );
          const untouched_bodies = bodies.filter(
            (str) => !prefixMap[key].includes(str)
          );

          return [common_prefix, factored_bodies, untouched_bodies];
        }
      }

      // If no common prefix found
      return [null, [], bodies];
    }

    this.Productions.forEach((bodies, header) => {
      // Keep factoring until there is no more to factor
      while (true) {
        // Get bodies of the production of A as strings
        const productions: string[] = [...bodies].map((body) =>
          body.content.map((symbol) => symbol.text).join("")
        );

        // Factor
        const factor_result = _factor(productions);

        // Is there is nothing to factor, exit
        if (factor_result[0] === null) break;

        // Delete all productions of A
        this.Productions.get(header)?.clear();

        // Declare new symbol to use
        // NOTE: This is because this program factors AFTER removing left recursion
        const symbol = _new_symbol(this, header);

        // Create productions:
        // A -> prefix A'
        this.add(`${header}->${factor_result[0]}${symbol}`);

        // A -> non-factorizable parts
        factor_result[2].forEach((body) => {
          this.add(`${header}->${body}`);
        });

        // A' -> factorized parts
        factor_result[1].forEach((body) => {
          // Check empty strings
          body = body === "" ? "&" : body;
          this.add(`${symbol}->${body}`);
        });
      }
    });
  }

  /**
   * Prints each production.
   */
  public print(): void {
    // Respect order
    this.NonTerminals.forEach((non_terminal) => {
      this.Productions.get(non_terminal)?.forEach(body => {
        console.log(
          `${non_terminal}->${body.content.map((symbol) => symbol.text).join("")}`
        );
      })
    });
  }
}
