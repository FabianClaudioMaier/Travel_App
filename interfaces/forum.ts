export interface Post {
    id: string;
    title: string;
    rating: number;
    content?: string;
    author: string;
    date: string;
    images?: string[];
}

export type Posts = Post[];
