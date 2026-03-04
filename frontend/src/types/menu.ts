export type MenuItem = {
  name: string;
  price: string;
};

export type Category = {
  name: string;
  items: MenuItem[];
};