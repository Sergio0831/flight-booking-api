import express, { Request, Response } from 'express';
import { Duffel, DuffelError } from '@duffel/api';
import cors from 'cors';
import axios from 'axios';
import {
  DuffelResponse,
  Offer,
  OfferRequest,
  OfferSlice,
  CreateOfferRequest,
  Aircraft,
  Airline,
  Airport,
  CreateOfferRequestPassenger,
} from '@duffel/api/types';
import { OfferRequestData } from './lib/definitions';

require('dotenv').config();

const app = express();
const accessToken = process.env.ACCESS_TOKEN ?? '';

const duffel = new Duffel({
  token: accessToken,
});

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '✨✈️✈️✈️👨🏻‍✈️👨🏻‍✈️👨🏻‍✈️🌎🌍🌏✨',
  });
});

app.post('/api/offers', async (req: Request<{}, {}, OfferRequestData>, res: Response) => {
  const { tripType, destination, from, formatedDepartDate, formatedReturnDate, adults, children } =
    req.body;
  const passengers: CreateOfferRequestPassenger[] = [];

  // Add adults to the passengers array
  for (let i = 0; i < Number(adults); i++) {
    passengers.push({
      type: 'adult',
    });
  }

  // Add children to the passengers array
  for (let i = 0; i < Number(children); i++) {
    passengers.push({
      age: 5,
    });
  }

  try {
    const offerRequest: CreateOfferRequest = {
      slices: [
        {
          origin: from,
          destination: destination,
          departure_date: formatedDepartDate,
        },
      ],
      passengers: passengers,
      max_connections: 0,
    };

    if (tripType === 'return') {
      offerRequest.slices.push({
        origin: destination,
        destination: from,
        departure_date: formatedReturnDate!,
      });
    }

    const response = await duffel.offerRequests.create(offerRequest);

    res.json(response.data.id);
  } catch (error) {
    if (error instanceof DuffelError) {
      res.json({
        title: error.errors[0].title,
        message: error.errors[0].message,
      });
      console.log(error);
    }
  }
});

app.get('/api/offers/:offerId', async (req: Request, res: Response) => {
  const { offerId } = req.params;

  try {
    const response = await duffel.offers.list({
      offer_request_id: offerId,
      limit: 5,
      sort: 'total_amount',
    });

    const offers = response.data.map((offer) => {
      return {
        id: offer.id,
        airlineLogo: offer.owner.logo_symbol_url,
        totalAmount: offer.total_amount,
        totalCurrency: offer.total_currency,
        passengers: offer.passengers.map((pass) => ({
          id: pass.id,
          type: pass.type,
        })),
        slices: offer.slices.map((slice) => {
          return {
            duration: slice.duration,
            origin: slice.origin.iata_city_code,
            destination: slice.destination.iata_city_code,
            segments: slice.segments.map((segment) => {
              return {
                departingAt: segment.departing_at,
                arrivingAt: segment.arriving_at,
                airlineLogo: segment.marketing_carrier.logo_symbol_url,
              };
            }),
          };
        }),
      };
    });

    res.json({ offers });
  } catch (error) {
    if (error instanceof DuffelError) {
      res.json({
        title: error.errors[0].title,
        message: error.errors[0].message,
      });
      console.log(error);
    }
  }
});

export default app;

//   try {
//     // const response = await duffel.aircraft.get('arc_00009VMF8AhXSSRnQDI6Hi');
//     // const response = await duffel.airlines.get('arl_00009VME7DAyfgJ6qz2UAH');
//     // const response = await duffel.airlines.list({
//     //   limit: 10,
//     // });
//     // const response = await duffel.airports.list({
//     //   limit: 10,
//     // });
//     const response = await duffel.offerRequests.get(
//       '"orq_0000AcVElZQ3y6MQoDCyUS',
//     );
//     // const aircraft: Aircraft = response.data;
//     // const airline = response.data;
//     // const airports: OfferRequest = response.data;
//     // const airlines: Airline[] = response.data;
//     res.json(response.data);
//   } catch (error) {
//     if (error instanceof DuffelError) {
//       console.log(error.errors[0].message);
//       // console.error('Error to get aircraft:', error.message || error);
//     }
//   }
