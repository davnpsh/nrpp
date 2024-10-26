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

    //this.get_symbols();
    //this.eliminate_recursion();
  }

  /**
   * Add production.
   * @param expression - String of the form A->aB.
   */
  private add(expression: string) {
    // Split header and body
    const parts: string[] = expression.split("->");
    let production: Set<Body> | null = null;

    // Get production body if it already exists
    for (const header of this.Productions.keys()) {
      if (header.content.text === parts[0]) {
        production = this.Productions.get(header) as Set<Body>;
        break;
      }
    }

    // If there is no production on that header, create it
    if (production === null) {
      production = new Set<Body>();
      this.Productions.set({ content: new Symbol(parts[0]) }, production);
    }

    // Parse body
    const body_symbols: Array<string> = parts[1].match(
      /[A-Z]'*|[^A-Z]+/g
    ) as Array<string>;

    // Add new production
    production.add({
      content: body_symbols.map((symbol) => new Symbol(symbol)),
    });
  }

  /**
   * Get terminal and non-terminal symbols
   */
  private get_symbols() {
    const seen_terminals: Set<string> = new Set();
    const seen_nonterminals: Set<string> = new Set();
    let text: string;

    this.Productions.forEach((production) => {
      // Get non-terminals from headers
      const header_content: Symbol = production.Header.content;
      text = header_content.text;

      if (!seen_nonterminals.has(text)) {
        seen_nonterminals.add(text);
        this.NonTerminals.add(header_content);
      }

      // Get terminals from body
      const body_content: Symbol[] = production.Body.content;

      for (const symbol of body_content) {
        text = symbol.text;

        if (!seen_terminals.has(text) && symbol.type === "terminal") {
          seen_terminals.add(text);
          this.Terminals.add(symbol);
        }
      }
    });
  }

  /**
   * Eliminate recursion on the productions.
   */
  private eliminate_recursion() {
    // Expand expression

    // Get rid of recursion
    this.NonTerminals.forEach((non_terminal: Symbol) => {
      let recursion: boolean = false;
      const old_productions: Set<Production> = new Set();

      // 1_) Get alpha and beta for A -> Aalpha|beta
      const alpha: Set<Symbol[]> = new Set();
      const beta: Set<Symbol[]> = new Set();

      this.Productions.forEach((production: Production) => {
        if (non_terminal.text === production.Header.content.text) {
          if (production.Body.content[0].text === non_terminal.text) {
            // 1_a) alpha
            alpha.add(production.Body.content.slice(1));
            // Detect recursion
            recursion = true;
          } else {
            // 1_b) beta
            beta.add(production.Body.content.slice(0));
          }
          // Keep track of old recursive productions
          old_productions.add(production);
        }
      });

      if (!recursion) return;

      // 2_) Delete old productions
      old_productions.forEach((production: Production) => {
        this.Productions.delete(production);
      });

      // 3_) Create new productions!
      // 3_b) beta
      if (beta.size === 0) {
        this.Productions.add(
          new Production(`${non_terminal.text}->${non_terminal.text}'`)
        );
      }
      beta.forEach((_beta: Symbol[]) => {
        this.Productions.add(
          new Production(
            `${non_terminal.text}->${_beta
              .map((symbol) => symbol.text)
              .join("")}${non_terminal.text}'`
          )
        );
      });
      // 3_a) alpha
      alpha.forEach((_alpha: Symbol[]) => {
        this.Productions.add(
          new Production(
            `${non_terminal.text}'->${_alpha
              .map((symbol) => symbol.text)
              .join("")}${non_terminal.text}'`
          )
        );
      });

      // 4_) Add epsilon production
      this.Productions.add(new Production(`${non_terminal.text}'->&`));

      // Add new created symbol
      this.NonTerminals.add(new Symbol(`${non_terminal.text}'`));
    });
  }

  /**
   * Prints each production.
   */
  public print() {
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
