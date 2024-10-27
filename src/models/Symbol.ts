export default class Symbol {
  public type: "terminal" | "non-terminal";
  public text: string;

  constructor(text: string) {
    // Detect if it is a terminal symbol
    // NOTE: Ignore ' char in the case of new symbols such as F' or F''
    this.type = /^[A-Z]'*$/.test(text[0]) ? "non-terminal" : "terminal";

    this.text = text;
  }
}
