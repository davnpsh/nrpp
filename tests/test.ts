import Grammar from "../src/models/Grammar.ts";
import First from "../src/models/First.ts";
import Follow from "../src/models/Follow.ts";

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
    
    const follow = new Follow(grammar, first);
    follow.print();
  },
});
