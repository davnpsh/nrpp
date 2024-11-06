import Grammar from "../src/models/Grammar.ts";
import First from "../src/models/First.ts";
import Follow from "../src/models/Follow.ts";
import M from "../src/models/M.ts";
import TDP from "../src/models/TDP.ts";

Deno.test({
  name: "general",
  async fn() {
    const filePath = "test.txt";

    // Read the file
    const data = await Deno.readTextFile(filePath);

    const grammar = new Grammar(data);
    grammar.print();

    const first = new First(grammar);
    first.print();

    const follow = new Follow(grammar);
    follow.print();

    const M_table = new M(grammar, follow);
    M_table.print();

    const TDP_table = new TDP(
      M_table,
      grammar.NonTerminals.get(0) as string,
      "(i,(i,(n)),(i))"
    );
    TDP_table.print();
    console.log(TDP_table.recognize);
  },
});
