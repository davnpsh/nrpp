import First from "./First.ts";
import Follow from "./Follow.ts";
import Grammar from "./Grammar.ts";
import M from "./M.ts";
import TDP from "./TDP.ts";

export default class NRPP {
  public grammar: Grammar;
  public first: First;
  public follow: Follow;
  public M_table: M;
  public TDP_table: (w: string) => TDP;

  constructor(data: string) {
    this.grammar = new Grammar(data);
    this.first = new First(this.grammar);
    this.follow = new Follow(this.grammar);
    this.M_table = new M(this.grammar, this.follow);
    this.TDP_table = (w: string) =>
      new TDP(this.M_table, this.grammar.NonTerminals.get(0) as string, w);
  }
}
