import { BlockEmbed } from 'quill/blots/block.js';

/**
 * Block horizontal rule for Quill, inserted from the journal keyboard toolbar.
 */
export class JournalDividerBlot extends BlockEmbed {
  static override blotName = 'journalDivider';
  static override className = 'ql-journal-hr';
  static override tagName = 'hr';

  static override create() {
    return super.create() as HTMLElement;
  }

  static override value(): boolean {
    return true;
  }
}

const registeredOnQuill = new WeakSet<typeof import('quill').default>();

/** Use the `Quill` from the same module as the running editor, e.g. `Object.getPrototypeOf(editor).constructor`. */
export function registerJournalQuillDividerBlot(Quill: typeof import('quill').default): void {
  if (registeredOnQuill.has(Quill)) {
    return;
  }
  Quill.register(JournalDividerBlot);
  registeredOnQuill.add(Quill);
}
