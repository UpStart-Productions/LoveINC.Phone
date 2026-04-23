import { BlockEmbed } from 'quill/blots/block.js';

/**
 * A Notion-style horizontal rule for Quill. Insert via {@link insertNotionStyleDivider} or type `---` on its own line.
 * Stored in Delta/HTML as a block <hr> with a stable class.
 */
export class JournalDividerBlot extends BlockEmbed {
  static override blotName = 'journalDivider';
  static override className = 'ql-journal-hr';
  static override tagName = 'hr';

  static override create() {
    const node = super.create() as HTMLElement;
    return node;
  }

  static override value(): boolean {
    return true;
  }
}

/**
 * One registration per Quill "class" (there can be multiple copies in a bundle; each copy has its
 * own registry). Never short-circuit with a global boolean or the "wrong" import's Quill can win.
 */
const registeredOnQuill = new WeakSet<typeof import('quill').default>();

/** Use the `Quill` static from the same module as the running editor, e.g. `Object.getPrototypeOf(editor).constructor`. */
export function registerJournalQuillDividerBlot(Quill: typeof import('quill').default): void {
  if (registeredOnQuill.has(Quill)) {
    return;
  }
  Quill.register(JournalDividerBlot);
  registeredOnQuill.add(Quill);
}
