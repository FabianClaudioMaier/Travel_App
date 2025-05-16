export interface Post {
    id: string;
    city_id: string;
    city_name: string;
    title: string;
    rating: number;
    content?: string;
    author: string;
    date: string;
    images?: string[];
}

export type Posts = Post[];
