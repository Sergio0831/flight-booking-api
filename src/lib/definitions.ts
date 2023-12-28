export interface OfferRequestData {
  tripType: string;
  destination: string;
  from: string;
  formatedDepartDate: string;
  formatedReturnDate?: string;
  adults: string;
  children: string;
}

export interface OrderRequestData {
  selectedOffer: string;
  passengers: {
    id: string;
    bornOn: string;
    title: 'mr' | 'ms' | 'mrs' | 'MR' | 'MS' | 'MRS';
    gender: 'm' | 'f';
    firstName: string;
    familyName: string;
  }[];
}
