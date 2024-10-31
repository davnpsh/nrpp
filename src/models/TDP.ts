import M from "./M.ts";
import Symbol from "./Symbol.ts";
import { Body } from "../types/index.ts";

export default class TDP {
  private data: Array<{ stack: Symbol[]; in: string; out: string | null }> = [];
  public recognize: boolean = false;

  constructor(M: M, S: string, w: string) {
    this.generate(M, S, w);
  }

  /**
   * Generate TDP table from the M table and a phrase
   * @param M - M table
   * @param S - Non-terminal to start
   * @param w - Phrase
   */
  private generate(M: M, S: string, w: string) {
    // Insert initial elements on the table
    this.data.push({
      stack: [new Symbol("$"), new Symbol(S)],
      in: w + "$",
      out: null,
    });

    let X: Symbol,
      a: string,
      row: { stack: Symbol[]; in: string; out: string | null },
      prod: Body | undefined;

    do {
      const last_row = this.data.at(-1)!;
      row = {
        stack: [...last_row.stack],
        in: last_row.in,
        out: last_row.out,
      };

      // X will be the top symbol of the stack
      X = row.stack.at(-1) as Symbol;

      // a will be the first char of w
      a = row.in[0] as string;

      if (X.type === "terminal") {
        if (X.text === a) {
          // Pop X from the stack
          row.stack.pop();
          // Pop a from w
          row.in = row.in.slice(1);
        } else break; // error
      } else {
        prod = M.get(X.text, a);
        if (prod) {
          // Pop X from the stack
          row.stack.pop();

          // Stack prod
          if (prod.content[0].text !== "&")
            row.stack = [...row.stack, ...[...prod.content].reverse()];

          // Out
          last_row.out = `${X.text}->${prod.content
            .map((symbol) => symbol.text)
            .join("")}`;
        } else break; // error
      }

      this.data.push(row);
    } while (X.text !== "$");

    if (X.text === "$") this.recognize = true;
  }

  /**
   * Prints each production.
   */
  public print(): void {
    const table_data = this.data.map((entry) => ({
      stack: entry.stack.map((symbol) => symbol.text).join(""),
      in: entry.in,
      out: entry.out,
    }));

    console.table(table_data);
  }
}
