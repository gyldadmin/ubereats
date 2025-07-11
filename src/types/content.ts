// Content management types

export interface ContentBlock {
  title: string;
  description: string;
  content: string;
}

export interface ContentDatabase {
  [key: string]: ContentBlock;
}

export type ContentKey = 'mentoring_how_it_works';

export interface ProcessedContent {
  title: string;
  description: string;
  content: string;
} 