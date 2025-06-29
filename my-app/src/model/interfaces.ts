export interface Apartment {
  id: number;
  owner: string;
  name: string;
  location: string;
  description: string;
  pricePerNight: bigint;
  imageUrls: string[];
}
