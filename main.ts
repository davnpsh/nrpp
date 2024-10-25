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

class Production {
  public Header: Header;
  public Body: Body;

  constructor(expression: string) {
    // Split header and body
    const parts: string[] = expression.split("->");

    // Add header
    this.Header = { content: new Symbol(parts[0]) };

    // Parse body
    const body_symbols: Array<string> = parts[1].match(
      /[A-Z]'*|[^A-Z]+/g
    ) as Array<string>;

    // Add body
    this.Body = {
      content: body_symbols.map((symbol) => new Symbol(symbol)),
    };
  }

  /**
   * @returns Production as a string.
   */
  public text = () =>
    `${this.Header.content.text}->${this.Body.content
      .map((symbol) => symbol.text)
      .join("")}`;
}

class Grammar {
  public Productions: Set<Production>;
  public Terminals = new Set<Symbol>();
  public NonTerminals = new Set<Symbol>();

  // Data is content of the grammar text file
  constructor(data: string) {
    this.Productions = new Set(
      // Map each line to a new production
      data.split("\n").map((line) => new Production(line))
    );

    this.get_symbols();
    this.eliminate_recursion();
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
    });
  }

  /**
   * Prints each production.
   */
  public print() {
    this.Productions.forEach((production) => {
      console.log(production.text());
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
