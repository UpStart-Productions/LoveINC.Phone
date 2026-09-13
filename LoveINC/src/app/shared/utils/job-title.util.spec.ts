import { trimJobTitle } from './job-title.util';

describe('trimJobTitle', () => {
  it('keeps a short role title', () => {
    expect(trimJobTitle('Kitchen Manager', "Bob's Burgers")).toBe('Kitchen Manager');
  });

  it('keeps a two-part qualifier', () => {
    expect(trimJobTitle('Server - Evening Shift', 'Olive Garden')).toBe('Server - Evening Shift');
  });

  it('drops company, pay, and leftover keyword dump', () => {
    expect(
      trimJobTitle(
        'CDL-A Company Driver - 1-5mpo EXP required - OTR - Dry Van - $1.5k per week - U.S. Xpress - OTR',
        'U.S. Xpress',
      ),
    ).toBe('CDL-A Company Driver');
  });

  it('keeps a short abbreviation plus the next part', () => {
    expect(trimJobTitle('RN - Emergency Department - Full Time', 'Providence')).toBe(
      'RN - Emergency Department',
    );
  });

  it('does not empty the title', () => {
    expect(trimJobTitle('U.S. Xpress', 'U.S. Xpress')).toBe('U.S. Xpress');
  });
});
