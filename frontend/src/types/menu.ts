export type MenuItem = {
  name: string;
  price: string;
  description?: string;
  available?: boolean;
};

export type Category = {
  name: string;
  items: MenuItem[];
};