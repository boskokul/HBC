export interface Apartment {
  id: number;
  owner: string;
  name: string;
  location: string;
  description: string;
  pricePerNight: bigint;
  imageUrls: string[];
}

export interface Booking {
  bookingId: number;
  apartmentId: number;
  guest: string;
  checkInDate: bigint;
  checkOutDate: bigint;
  totalPrice: bigint;
  status: BookingStatus;
  timestamp: bigint;
}

export type BookingStatus =
  | "Booked"
  | "CheckedIn"
  | "CheckedOut"
  | "Cancelled"
  | "Refunded";
