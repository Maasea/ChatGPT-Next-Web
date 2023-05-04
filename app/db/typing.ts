export type QueryObject = {
  [key: string]: any;
};

export type Usage = {
  accessToken: string;
  apiKey: string;
  model: string;
  prompt: number;
  completion: number;
  price: number;
  createDate: Date;
};

export interface User {
  name: string;
  accessToken: string;
  remark?: string;
}
