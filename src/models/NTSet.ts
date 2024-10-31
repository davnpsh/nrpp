export default class NTSet {
  private order: string[] = [];
  private unique: Set<string> = new Set();

  /**
   * Add non-terminal to the set.
   * @param element - Non-terminal to add.
   */
  public add(element: string): void {
    // If the element lready exists, don't add it.
    if (this.unique.has(element)) return;

    // If it is similar to an existing one, find it
    const last_similar_index = this.order
      .slice()
      .reverse()
      .findIndex((e) => e.startsWith(element.slice(0, -1)));

    if (last_similar_index !== -1) {
      // Insert after the last similar element
      const insert_index = this.order.length - last_similar_index - 1 + 1;
      this.order.splice(insert_index, 0, element);
    } else {
      // If no similar element is found, push to the end
      this.order.push(element);
    }

    // Add to the set for uniqueness
    this.unique.add(element);
  }

  /**
   * @param index - Index of the element.
   * @returns Non-terminal.
   */
  public get(index: number): string | undefined {
    return this.order[index];
  }

  /**
   * @returns All non-terminals.
   */
  public getAll(): string[] {
    return [...this.order];
  }

  /**
   * @returns Size of the set.
   */
  public size(): number {
    return this.order.length;
  }

  /**
   * @returns Element of the set if found.
   */
  public has(element: string): boolean {
    return this.unique.has(element);
  }

  // Method to iterate over elements
  forEach(callback: (element: string) => void): void {
    this.order.forEach(callback);
  }
}
