interface Header {
  content: Symbol;
}

interface Body {
  content: Symbol[];
}

class Symbol {
  public type: "terminal" | "non-terminal";
  public text: string;

  constructor(text: string) {
    // Detect if it is a terminal symbol
    // NOTE: Ignore ' char in the case of new symbols such as F' or F''
    this.type = /^[A-Z]'*$/.test(text[0]) ? "non-terminal" : "terminal";

    this.text = text;
  }
}

class Grammar {
  public Productions: Map<Header, Set<Body>> = new Map();
  public Terminals: Set<Symbol> = new Set();
  public NonTerminals: Set<Symbol> = new Set();

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

    this.get_symbols();
    this.remove_left_recursion();
    this.factor_left();
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
    let production = [...this.Productions.keys()].find(
      (header) => header.content.text === header_text
    );

    // If there is no production on that header, create it
    if (!production) {
      production = { content: new Symbol(header_text) };
      this.Productions.set(production, new Set<Body>());
    }

    // Parse body
    const body_symbols =
      body_text
        .replace(/&/g, "") // Remove all '&' characters
        .match(/[A-Z]'*|[^A-Z]+/g)
        ?.map((symbol) => new Symbol(symbol)) || [];

    if (body_text === "&") {
      body_symbols.push(new Symbol("&"));
    }

    // Add new production
    this.Productions.get(production)?.add({ content: body_symbols });
  }

  /**
   * Get terminal and non-terminal symbols
   */
  private get_symbols(): void {
    const seen_terminals: Set<string> = new Set();

    this.Productions.forEach((bodies, header) => {
      // Add non-terminals based on header
      this.NonTerminals.add(header.content);

      // Add terminals from the bodies of productions
      for (const body of bodies) {
        for (const symbol of body.content) {
          if (!seen_terminals.has(symbol.text) && symbol.type === "terminal") {
            seen_terminals.add(symbol.text);
            this.Terminals.add(symbol);
          }
        }
      }
    });
  }

  /**
   * Remove all left recursion on the productions.
   * This is based on the algorithm provided in https://en.m.wikipedia.org/wiki/Left_recursion
   */
  private remove_left_recursion(): void {
    const non_terminals = [...this.NonTerminals];

    // Find index of non-terminals
    function _index(symbol: string): number {
      return non_terminals.findIndex(
        (non_terminal) => non_terminal.text === symbol
      );
    }

    const headers = [...this.Productions.keys()];
    const productions = this.Productions;

    // Find bodies given a string
    function _body(symbol: string): Set<Body> {
      const header = headers.find(
        (header) => header.content.text === symbol
      ) as Header;
      return productions.get(header) as Set<Body>;
    }

    // For each terminal A_i:
    this.Productions.forEach((bodies, header) => {
      // Repeat until an iteration leaves the grammar unchanged:
      let changed = true;
      while (changed) {
        changed = false;
        // For each production A_i -> body_i
        bodies.forEach((body) => {
          // If body_i begins with a non-terminal A_j and j < i
          if (
            body.content[0].type === "non-terminal" &&
            _index(body.content[0].text) < _index(header.content.text)
          ) {
            // Let b_i be body_i without its leading A_j
            const b_i: Symbol[] = body.content.slice(1);
            // Remove the rule A_i -> body_i
            this.Productions.get(header)?.delete(body);
            // For each production with A_j -> body_j
            // Add a new production A_i -> body_j b_i
            const bodies_j: Set<Body> = _body(body.content[0].text);
            bodies_j.forEach((body_j) => {
              this.add(
                `${header.content.text}->${body_j.content
                  .map((symbol) => symbol.text)
                  .join("")}${b_i.map((symbol) => symbol.text).join("")}`
              );
            });
            changed = true;
          }
        });
      }

      // Remove direct left recursion for A_i
      let recursion: boolean = false;
      const old_productions: Set<Body> = new Set();

      // 1_) Get alpha and beta for A -> Aalpha|beta
      const alpha: Set<Symbol[]> = new Set();
      const beta: Set<Symbol[]> = new Set();

      bodies.forEach((body) => {
        // Direct recursion
        if (header.content.text === body.content[0].text) {
          recursion = true;

          // 1_a) alpha
          alpha.add(body.content.slice(1));
        } else {
          // 1_b) beta
          beta.add(body.content.slice(0));
        }
        // Keep track of old recursive productions
        old_productions.add(body);
      });

      if (!recursion) return;

      // 2_) Delete old productions
      old_productions.forEach((body: Body) => {
        this.Productions.get(header)?.delete(body);
      });

      // 3_) Create new productions
      // 3_b) beta
      if (beta.size === 0) {
        this.add(`${header.content.text}->${header.content.text}'`);
      }
      beta.forEach((_beta: Symbol[]) => {
        this.add(
          `${header.content.text}->${_beta
            .map((symbol) => symbol.text)
            .join("")}${header.content.text}'`
        );
      });
      // 3_a) alpha
      alpha.forEach((_alpha: Symbol[]) => {
        this.add(
          `${header.content.text}'->${_alpha
            .map((symbol) => symbol.text)
            .join("")}${header.content.text}'`
        );
      });

      // 4_) Add epsilon production
      this.add(`${header.content.text}'->&`);

      // Add new created symbol (A')
      this.NonTerminals.add(new Symbol(`${header.content.text}'`));
    });
  }

  /**
   * Factor
   */
  private factor_left(): void {
    const grammar_productions = this.Productions;

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

    function _new_symbol(old_header: Header): string {
      let new_symbol = `${old_header.content.text}'`;
      let already_exists;

      while (true) {
        already_exists = [...grammar_productions.keys()].find(
          (header) => header.content.text === new_symbol
        );

        if (already_exists) {
          new_symbol = `${new_symbol}'`;
        } else {
          return new_symbol;
        }
      }
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
        const symbol = _new_symbol(header);

        // Add new symbol to non-terminals
        this.NonTerminals.add(new Symbol(symbol));

        // Create productions:
        // A -> prefix A'
        this.add(`${header.content.text}->${factor_result[0]}${symbol}`);

        // A -> non-factorizable parts
        factor_result[2].forEach((body) => {
          this.add(`${header.content.text}->${body}`);
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
    this.Productions.forEach((bodies, header) => {
      for (const body of bodies) {
        console.log(
          `${header.content.text}->${body.content
            .map((symbol) => symbol.text)
            .join("")}`
        );
      }
    });
  }
}

// -- GRAMMAR INPUT --
const filePath = "test.txt";

try {
  // Read the file
  const data = await Deno.readTextFile(filePath);

  const grammar = new Grammar(data);
  grammar.print();
} catch (err) {
  console.error("Error reading the file:", err);
}
