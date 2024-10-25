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

    // Add body
    this.Body = {
      content: Array.from(parts[1], (symbol) => new Symbol(symbol)),
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

  // Data is content of the grammar text file
  constructor(data: string) {
    this.Productions = new Set(
      // Map each line to a new production
      data.split("\n").map((line) => new Production(line))
    );

    this.eliminate_recursion();
  }

  /**
   * Prints each production.
   */
  public print() {
    this.Productions.forEach((production) => {
      console.log(production.text());
    });
  }

  /**
   * Eliminate recursion on the productions
   */
  private eliminate_recursion() {}
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
