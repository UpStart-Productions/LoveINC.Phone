export type { JournalEntry } from './lib/types/journal-entry.model';
export type { JournalEntryShareOptions } from './lib/journal-entry-share.token';
export { JOURNAL_ENTRY_SHARE } from './lib/journal-entry-share.token';
export {
  JOURNAL_NAVIGATION_RETURN,
  type JournalNavigationReturnHandler,
} from './lib/journal-navigation-return.token';
export { JournalDatabaseService } from './lib/services/journal-database.service';
export { JournalService } from './lib/services/journal.service';
export { QuillToolbarService } from './lib/rich-text/quill-toolbar.service';
export { JournalQuillEditorComponent } from './lib/rich-text/quill-editor.component';
export { JournalQuillFloatingToolbarComponent } from './lib/rich-text/quill-floating-toolbar.component';
export { JournalShellPage } from './lib/journal-shell.page';
export { JournalListPage } from './lib/journal-list.page';
export { JournalEntryPage } from './lib/journal-entry.page';

export const JOURNAL_TOOL_CARD = {
  category: 'Personal Growth',
  categoryIcon: 'book-outline',
  title: 'Journal',
  detail: 'Capture notes and personal reflection',
  iconName: 'book-outline',
  iconBackgroundColor: '#2c5f7d',
  route: '/tabs/journal',
} as const;
