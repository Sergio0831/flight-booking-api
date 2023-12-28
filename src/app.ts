import express, { Request, Response } from 'express';
import { Duffel, DuffelError } from '@duffel/api';
import cors from 'cors';
import { CreateOfferRequest, CreateOfferRequestPassenger } from '@duffel/api/types';
import { OfferRequestData, OrderRequestData } from './lib/definitions';

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

app.post('/api/offer_requests', async (req: Request<{}, {}, OfferRequestData>, res: Response) => {
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
    }
  }
});

app.get('/api/offers/:offerRequestId', async (req: Request, res: Response) => {
  const { offerRequestId } = req.params;

  try {
    const response = await duffel.offers.list({
      offer_request_id: offerRequestId,
      limit: 5,
      sort: 'total_amount',
    });

    const offers = response.data.map((offer) => {
      return {
        id: offer.id,
        totalAmount: offer.total_amount,
        totalCurrency: offer.total_currency,
        passengers: offer.passengers.map((pass) => ({
          id: pass.id,
          type: pass.type,
        })),
        slices: offer.slices.map((slice) => {
          return {
            sliceId: slice.id,
            duration: slice.duration,
            origin: slice.origin.iata_city_code,
            destination: slice.destination.iata_city_code,
            segments: slice.segments.map((segment) => {
              return {
                segmentId: segment.id,
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
    }
  }
});

app.get('/api/offer/:offerId', async (req: Request, res: Response) => {
  const { offerId } = req.params;

  try {
    const response = await duffel.offers.get(offerId);

    res.json({ passengers: response.data.passengers });
  } catch (error) {
    if (error instanceof DuffelError) {
      res.json({
        title: error.errors[0].title,
        message: error.errors[0].message,
      });
    }
  }
});

app.post('/api/orders', async (req: Request<{}, {}, OrderRequestData>, res: Response) => {
  const { selectedOffer, passengers } = req.body;

  try {
    const response = await duffel.orders.create({
      passengers: passengers.map((pass) => {
        return {
          phone_number: '+442080160509',
          email: 'example@example.com',
          born_on: pass.bornOn,
          title: pass.title,
          gender: pass.gender,
          given_name: pass.firstName,
          family_name: pass.familyName,
          id: pass.id,
        };
      }),
      selected_offers: [selectedOffer],
      type: 'pay_later',
    });

    res.json(response.data.id);
  } catch (error) {
    if (error instanceof DuffelError) {
      res.json({
        title: error.errors[0].title,
        message: error.errors[0].message,
      });
    }
  }
});

app.get('/api/orders/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const response = await duffel.orders.get(orderId);
    const order = {
      totalAmount: response.data.total_amount,
      totalCurrency: response.data.total_currency,
      passengers: response.data.passengers.map((pass) => ({
        id: pass.id,
        title: pass.title,
        firstName: pass.given_name,
        familyName: pass.family_name,
        dob: pass.born_on,
        gender: pass.gender,
      })),
      slices: response.data.slices.map((slice) => ({
        sliceId: slice.id,
        duration: slice.duration,
        origin: slice.origin.iata_city_code,
        destination: slice.destination.iata_city_code,
        segments: slice.segments.map((segment) => ({
          segmentId: segment.id,
          departingAt: segment.departing_at,
          arrivingAt: segment.arriving_at,
          airlineLogo: segment.marketing_carrier.logo_symbol_url,
        })),
      })),
    };

    res.json({ order });
  } catch (error) {
    if (error instanceof DuffelError) {
      res.json({
        title: error.errors[0].title,
        message: error.errors[0].message,
      });
    }
  }
});

export default app;
