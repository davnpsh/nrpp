interface Header {
  content: Symbol;
}

interface Body {
  content: Symbol[];
}

class Symbol {
  public type: "terminal" | "non-terminal";
  public content: string;

  constructor(content: string) {
    // Detect if it is a terminal symbol
    // NOTE: Ignore ' char in the case of new symbols such as F' or F''
    this.type = /^[A-Z]'*$/.test(content[0]) ? "non-terminal" : "terminal";

    this.content = content;
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

  public text = () => `${this.Header}->${this.Body.content.join()}`;
}

// -- GRAMMAR INPUT --
const filePath = "test.txt";

try {
  // Read the file
  const data = await Deno.readTextFile(filePath);
  const lines = data.split("\n");

  for (const line of lines) {
    const production = new Production(line);
    console.log(production);
  }
} catch (err) {
  console.error("Error reading the file:", err);
}
