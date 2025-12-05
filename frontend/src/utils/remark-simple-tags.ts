import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node, Parent, Literal } from 'unist';

interface TextNode extends Literal {
  value: string;
}

interface CustomTagNode extends Parent {
  type: 'en' | 'cn';
  data: {
    hName: string;
    hProperties: Record<string, unknown>;
  };
  children: Node[];
}

/**
 * Remark plugin to parse <en>...</en> and <cn>...</cn> tags
 * and convert them into custom AST nodes.
 */
const remarkSimpleTags: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'text', (node: TextNode, index: number | undefined, parent: Parent | undefined) => {
      if (!parent || index === undefined) return;

      const value = node.value;
      // Regex to find <en>...</en> or <cn>...</cn>
      // We use a non-greedy match for content
      const regex = /<(en|cn)>([\s\S]*?)<\/\1>/g;
      
      if (!regex.test(value)) return;

      const children: Node[] = [];
      let lastIndex = 0;
      let match;

      // Reset regex
      regex.lastIndex = 0;

      while ((match = regex.exec(value)) !== null) {
        // Push preceding text
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: value.slice(lastIndex, match.index),
          } as Literal);
        }

        const tagName = match[1] as 'en' | 'cn';
        const content = match[2];

        children.push({
          type: tagName,
          data: {
            hName: tagName, // This tells rehype to render as <en> or <cn> element
            hProperties: {},
          },
          children: [{ type: 'text', value: content } as Literal]
        } as unknown as CustomTagNode);

        lastIndex = regex.lastIndex;
      }

      // Push remaining text
      if (lastIndex < value.length) {
        children.push({
          type: 'text',
          value: value.slice(lastIndex),
        } as Literal);
      }

      // Replace the original text node with the new children
      parent.children.splice(index, 1, ...children);
      // Return index + children.length to skip over the newly added nodes
      return index + children.length;
    });
  };
};

export default remarkSimpleTags;
