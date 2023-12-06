/**
 * 让 container 的第一个子节点的所有子节点插入到 container 中，删除 container 的第一个子节点
 */
export const flattenContainer = (container: HTMLElement) => {
  if (
    container.childElementCount === 1 &&
    container.children[0].tagName === 'P'
  ) {
    const p = container.children[0];
    for (const child of Array.from(p.children)) {
      container.insertBefore(child, p);
    }
    container.removeChild(p);
  }
};

/**
 * 在 text 中，在 pos 的左右统计换行的次数，\n和\r同时出现将算作一次换行
 */
export const countLineBreaking = (
  text: string,
  pos: number,
  forward: boolean,
  max = Infinity,
) => {
  let count = 0;
  if (forward) {
    // 向前
    for (let i = pos - 1; i >= 0 && count < max; i--) {
      if (text[i] === '\n') {
        count++;
      } else if (text[i] !== '\r') {
        break;
      }
    }
  } else {
    // 向后
    const len = text.length;
    for (let i = pos; i < len && count < max; i++) {
      if (text[i] === '\n') {
        count++;
      } else if (text[i] !== '\r') {
        break;
      }
    }
  }
  return count;
};

export const isChinese = () =>
  $tw.wiki.getTiddler('$:/language')!.fields.text.includes('zh');
