import Grammar from "../src/models/Grammar.ts";
import First from "../src/models/First.ts";

Deno.test({
  name: "general",
  async fn() {
    const filePath = "test.txt";

    // Read the file
    const data = await Deno.readTextFile(filePath);

    const grammar = new Grammar(data);
    grammar.print();

    console.log(grammar);

    //const first = new First(grammar);
    //first.print();
  },
});
