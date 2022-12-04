import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBookingByuserId(userId);
    return res.status(httpStatus.OK).send({
      id: booking.id,
      Rooms: booking.Room
    });
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if (error.name === "forbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { roomId } = req.body;
  const { userId } = req;

  if (isNaN(roomId)) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }

  try {
    const booked = await bookingService.bookSelectedRoom(Number(userId), Number(roomId));
    const bookedIdString = booked.id.toString();
    return res.status(httpStatus.OK).send(bookedIdString);
  }

  catch (error) {
    if (error.name === "forbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { bookingId } = req.params;
  const { roomId } = req.body;
  const { userId } = req;

  const idBooking = Number(bookingId);

  if (isNaN(idBooking) || isNaN(roomId)) {
    res.sendStatus(httpStatus.BAD_REQUEST);
  }
  try {
    const update = await bookingService.changeBooking(Number(userId), Number(roomId), idBooking);
    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if (error.name === "forbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}
