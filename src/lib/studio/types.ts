export type StoryImage = {
  id: string;
  url: string;
  caption?: string;
};

export type Story = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  images: StoryImage[];
  featuredImageId?: string;
  publishedAt: string;
  tags: string[];
};

export type Clip = {
  id: string;
  title: string;
  slug: string;
  description: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  publishedAt: string;
  tags: string[];
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  caption: string;
  images: StoryImage[];
  featuredImageId?: string;
  publishedAt: string;
  tags: string[];
};

export type StudioCatalog = {
  stories: Story[];
  clips: Clip[];
  albums: Album[];
  updatedAt: string | null;
};
