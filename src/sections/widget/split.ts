import type { IParseTreeNode, WikiParser } from 'tiddlywiki';

export const split = (
  title: string,
): [
  [number, number],
  [number, number, IParseTreeNode[]][],
  WikiParser,
  IParseTreeNode[],
] => {
  const parser = $tw.wiki.parseTiddler(title);
  const { tree, usingRuleMap, sourceLength } = parser as any;
  let root = tree;
  while (root[0]?.rule && usingRuleMap[root[0].rule]?.types?.pragma) {
    root = root[0].children ?? [];
  }

  if (root.length === 0) {
    return [[0, sourceLength], [], parser, root];
  } else {
    const blocks: [number, number, IParseTreeNode[]][] = [];
    const paragma: [number, number] = [0, root[0].start];
    let start;
    let end;
    let subtrees: IParseTreeNode[] = [];
    for (const block of root) {
      if (block.start !== undefined) {
        // eslint-disable-next-line prefer-destructuring
        start = block.start;
      }
      if (block.end !== undefined) {
        // eslint-disable-next-line prefer-destructuring
        end = block.end;
      }
      subtrees.push(block);
      if (start === undefined || end === undefined) {
        continue;
      }
      blocks.push([start, end, subtrees]);
      start = undefined;
      end = undefined;
      subtrees = [];
    }
    if (blocks.length > 0) {
      blocks[blocks.length - 1][1] = sourceLength;
    }
    return [paragma, blocks, parser, root];
  }
};
