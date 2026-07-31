export type NotionBlock = {
  id: string;
  type: string;

  raw: any;

  children: NotionBlock[];
};