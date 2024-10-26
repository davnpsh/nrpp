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
    this.eliminate_recursion();
  }

  /**
   * Add production.
   * @param expression - String of the form A->aB.
   */
  private add(expression: string) {
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
        .match(/[A-Z]'*|[^A-Z]+/g)
        ?.map((symbol) => new Symbol(symbol)) || [];

    // Add new production
    this.Productions.get(production)?.add({ content: body_symbols });
  }

  /**
   * Get terminal and non-terminal symbols
   */
  private get_symbols() {
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
   * Eliminate recursion on the productions.
   */
  private eliminate_recursion() {
    // Get rid of direct recursions
    this.Productions.forEach((bodies, header) => {
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
