export type MenuItem = {
  name: string;
  price: string;
  description?: string;
  available?: boolean;
  visible?: boolean;
};

export type Category = {
  name: string;
  visible?: boolean;
  items: MenuItem[];
};
