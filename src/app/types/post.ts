export interface Post {
  id: string;
  eventName: string;
  artistName?: string;
  date: string;
  time: string;
  location: string;
  prefecture: string;
  website?: string;
  comment?: string;
  userId: string;
  user?: {
    id: string;
    email: string;
  };
  createdAt: string;
} 