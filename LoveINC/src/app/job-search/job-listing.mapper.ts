import { differenceInCalendarDays, format } from 'date-fns';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import type { PlatformJobListing } from '../services/platform/types';
import { trimJobTitle } from '../shared/utils/job-title.util';

export const JOB_LOGO_TILE_GREY = '#e6e6e6';

export function companyRouteKey(companyName: string): string {
  return encodeURIComponent(companyName);
}

export function formatJobSalary(min?: number, max?: number): string | undefined {
  if (min == null && max == null) return undefined;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null && min !== max) {
    return `${fmt(min)}–${fmt(max)}`;
  }
  return fmt(min ?? max!);
}

export function formatCompanySalaryRange(jobs: PlatformJobListing[]): string | undefined {
  const amounts: number[] = [];
  for (const job of jobs) {
    if (job.salaryMin != null) amounts.push(job.salaryMin);
    if (job.salaryMax != null) amounts.push(job.salaryMax);
  }
  if (!amounts.length) return undefined;
  return formatJobSalary(Math.min(...amounts), Math.max(...amounts));
}

export function formatJobPostedAt(postedAt: string): string | undefined {
  const d = new Date(postedAt);
  if (Number.isNaN(d.getTime())) return undefined;
  return format(d, 'MMM d');
}

/** True when the listing was posted more than 14 days ago. */
export function isJobPostedOverTwoWeeks(postedAt: string): boolean {
  const d = new Date(postedAt);
  if (Number.isNaN(d.getTime())) return false;
  return differenceInCalendarDays(new Date(), d) > 14;
}

export function jobMatchesSearch(job: PlatformJobListing, query: string): boolean {
  const salary = formatJobSalary(job.salaryMin, job.salaryMax);
  const fields = [
    job.title,
    trimJobTitle(job.title, job.companyName),
    job.companyName,
    salary,
    ...(job.locations ?? []),
    ...(job.tags ?? []),
  ]
    .filter((field): field is string => field != null && field !== '')
    .map((field) => field.toLowerCase());
  return fields.some((field) => field.includes(query));
}

export function mapJobToListItem(
  job: PlatformJobListing,
  options?: { saved?: boolean; staleDatePill?: boolean },
): ContentCardListItem {
  const locations = (job.locations ?? []).filter(Boolean);
  const locationLabel =
    locations.length === 0
      ? undefined
      : locations.length === 1
        ? locations[0]
        : 'Multiple locations';
  const salary = formatJobSalary(job.salaryMin, job.salaryMax);
  const detail = [salary, locationLabel].filter(Boolean).join(' · ');
  const tags = (job.tags ?? []).filter(Boolean).slice(0, 4);
  return {
    id: job.id,
    title: trimJobTitle(job.title, job.companyName),
    tags: tags.length ? tags : undefined,
    underTitle: job.companyName,
    detail: detail || undefined,
    imageUrl: job.logoUrl || undefined,
    imageOnMutedBackground: true,
    lucideIcon: job.logoUrl ? undefined : 'briefcase',
    iconBackgroundColor: JOB_LOGO_TILE_GREY,
    createdAtLabel: formatJobPostedAt(job.postedAt),
    createdAtLabelDanger: options?.staleDatePill === true && isJobPostedOverTwoWeeks(job.postedAt),
    clickable: true,
    saveToggle: true,
    saved: options?.saved ?? false,
  };
}

export type JobCompanyGroup = {
  companyName: string;
  jobs: PlatformJobListing[];
  logoUrl?: string;
};

export function groupJobsByCompany(jobs: PlatformJobListing[]): JobCompanyGroup[] {
  const groups = new Map<string, JobCompanyGroup>();
  for (const job of jobs) {
    const companyName = job.companyName?.trim() || 'Unknown';
    const existing = groups.get(companyName);
    if (existing) {
      existing.jobs.push(job);
      if (!existing.logoUrl && job.logoUrl) existing.logoUrl = job.logoUrl;
    } else {
      groups.set(companyName, {
        companyName,
        jobs: [job],
        logoUrl: job.logoUrl || undefined,
      });
    }
  }
  return [...groups.values()];
}

export type CompanySort = 'date' | 'salary' | 'name';

function companySalaryHigh(jobs: PlatformJobListing[]): number | undefined {
  const amounts: number[] = [];
  for (const job of jobs) {
    if (job.salaryMin != null) amounts.push(job.salaryMin);
    if (job.salaryMax != null) amounts.push(job.salaryMax);
  }
  if (!amounts.length) return undefined;
  return Math.max(...amounts);
}

function compareCompanyName(a: JobCompanyGroup, b: JobCompanyGroup): number {
  return a.companyName.localeCompare(b.companyName, undefined, { sensitivity: 'base' });
}

export function sortCompanyGroups(
  groups: JobCompanyGroup[],
  sort: CompanySort,
): JobCompanyGroup[] {
  return [...groups].sort((a, b) => {
    if (sort === 'name') return compareCompanyName(a, b);
    if (sort === 'salary') {
      const aMax = companySalaryHigh(a.jobs) ?? Number.NEGATIVE_INFINITY;
      const bMax = companySalaryHigh(b.jobs) ?? Number.NEGATIVE_INFINITY;
      if (bMax !== aMax) return bMax - aMax;
      return compareCompanyName(a, b);
    }
    const aTs = Date.parse(latestPostedAt(a.jobs) ?? '') || 0;
    const bTs = Date.parse(latestPostedAt(b.jobs) ?? '') || 0;
    if (bTs !== aTs) return bTs - aTs;
    return compareCompanyName(a, b);
  });
}

function latestPostedAt(jobs: PlatformJobListing[]): string | undefined {
  let latest: string | undefined;
  let latestTs = Number.NEGATIVE_INFINITY;
  for (const job of jobs) {
    const ts = Date.parse(job.postedAt);
    if (!Number.isNaN(ts) && ts > latestTs) {
      latestTs = ts;
      latest = job.postedAt;
    }
  }
  return latest;
}

export function mapCompanyToListItem(group: JobCompanyGroup): ContentCardListItem {
  const count = group.jobs.length;
  const latest = latestPostedAt(group.jobs);
  const countLabel = count === 1 ? '1 job' : `${count} jobs`;
  const salary = formatCompanySalaryRange(group.jobs);
  return {
    id: companyRouteKey(group.companyName),
    title: group.companyName,
    detail: [countLabel, salary].filter(Boolean).join(' · '),
    imageUrl: group.logoUrl,
    imageOnMutedBackground: true,
    lucideIcon: group.logoUrl ? undefined : 'briefcase',
    iconBackgroundColor: JOB_LOGO_TILE_GREY,
    createdAtLabel: latest ? formatJobPostedAt(latest) : undefined,
    route: `/tabs/job-search/company/${companyRouteKey(group.companyName)}`,
    navigationFrom: 'job-search',
    clickable: true,
  };
}
