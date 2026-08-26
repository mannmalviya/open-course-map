export interface XY {
  x: number;
  y: number;
}

export interface Version {
  label: string;
  /** Course homepage (OCW, university site, …) */
  url?: string;
  /** YouTube playlist for the lectures */
  youtube?: string;
  /** When this run of the course took place, e.g. "Fall 2020" */
  date?: string;
  /** YouTube video id — used to derive a thumbnail, no scraping involved */
  youtubeId?: string;
  /** Explicit thumbnail URL for non-YouTube sources */
  thumbnail?: string;
  primary?: boolean;
}

/** Academic level as the offering school classifies it */
export type Level = 'undergrad' | 'grad';

export interface Textbook {
  title: string;
  /** Display string, e.g. "Cormen, Leiserson, Rivest & Stein" */
  authors: string;
  /** Only where the publisher or authors offer the book free */
  url?: string;
  /**
   * Basename of a cover in public/covers/, without extension. The same book
   * shares a slug across courses. Set even when the file is not there yet —
   * a missing cover falls back to the text-only card.
   */
  cover?: string;
}

export interface Course {
  title: string;
  university?: string;
  /** Absent for courses with no academic level (open lecture series, MOOCs) */
  level?: Level;
  /** Absent where the course has no unambiguous assigned text */
  textbooks?: Textbook[];
  /** When the course was offered, e.g. "Fall 2020" — defaults to the primary version's date */
  term?: string;
  /** Subject this course belongs to — stamped from the subject filename at load */
  group: string;
  pos: XY;
  versions: Version[];
}

/**
 * How a pathway's ordering was arrived at. `official` sequences are transcribed
 * from a department's own requirements; `curated` ones are a personal pick.
 */
export type PathwayKind = 'official' | 'curated';

/** A field (Math, Physics, …) or a subject (Quantum Mechanics, …) — same recursive shape */
export interface Group {
  title: string;
  parent?: string;
  /** Position and size of this group's box on its parent's page */
  pos?: XY;
  size?: { w: number; h: number };
  /** Present only on pathway groups — a sequence rather than a subject */
  kind?: PathwayKind;
  /** One-line pitch, shown on the landing page card */
  blurb?: string;
  /** Where the ordering came from, e.g. "transcribed from MIT's 6-3 requirements" */
  source?: string;
  /** Section this pathway is listed under, e.g. "CS" — see SECTIONS in PathwayCards */
  field?: string;
  /**
   * Marks on this pathway's landing card, as `university` keys. An override:
   * a sequence can borrow a course from anywhere, so set this where the marks
   * should say whose sequence it is rather than everyone who turns up in it.
   * Left out, the card marks the schools its own steps come from.
   */
  logos?: string[];
}

export interface Edge {
  /** course or group id that should be done first */
  from: string;
  /** course or group id that depends on it */
  to: string;
}

export interface Ghost {
  /** course or group id this ghost references */
  node: string;
  /** group page the ghost is placed on */
  inGroup: string;
  pos: XY;
  /** Why this step is here — sourced fact on official pathways, opinion on curated ones */
  note?: string;
}

/**
 * A step in an official pathway that the department requires but nobody has put
 * online. Rendered as a real node so the sequence stays faithful instead of
 * silently skipping it.
 */
export interface Gap {
  /** Stable id so pathway edges can point at it */
  id: string;
  title: string;
  /** Why it belongs in the sequence */
  note?: string;
  /** Pathway page this gap is placed on — stamped from the filename at load */
  inGroup: string;
  pos: XY;
  /** Course ids that cover similar ground, offered as an alternative, not a swap */
  alternates?: string[];
}

export interface CourseMap {
  groups: Record<string, Group>;
  courses: Record<string, Course>;
  edges: Edge[];
  ghosts: Ghost[];
  gaps: Record<string, Gap>;
  /**
   * Kept out of `edges` on purpose: a pathway's arrows describe that sequence
   * only. Merging them into the prerequisite graph would invent prerequisites
   * on subject pages and in a course's "do first" list.
   */
  pathwayEdges: Record<string, Edge[]>;
}

/** Shape of data/fields.json: the atlas — all groups, plus everything that spans subjects */
export interface FieldsFile {
  groups: Record<string, Group>;
  edges: Edge[];
  ghosts: Ghost[];
}

/** Shape of data/subjects/<subject-id>.json; the filename is the subject id */
export interface SubjectFile {
  courses: Record<string, Omit<Course, 'group'>>;
  /** Edges between this subject's own courses */
  edges?: Edge[];
}

/**
 * Shape of data/pathways/<pathway-id>.json; the filename is the pathway id.
 * A pathway owns no courses — its steps are placed references to courses that
 * already live in a subject, so the same course can appear on several pathways.
 */
export interface PathwayFile {
  title: string;
  kind: PathwayKind;
  blurb: string;
  source: string;
  field: string;
  /** School marks for the landing card — see `logos` on Group */
  logos?: string[];
  /** Ordered for readability; the edges are what actually define the sequence */
  steps: Array<{ course: string; pos: XY; note?: string }>;
  gaps?: Array<Omit<Gap, 'inGroup'>>;
  edges?: Edge[];
}

export interface Lecture {
  /** YouTube video id — absent in snapshots taken before ids were recorded */
  id?: string;
  title: string;
  views: number;
}

/** Shape of data/views/<playlistId>.json — generated by scripts/fetch-views.py */
export interface ViewsFile {
  lectures: Lecture[];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
