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
    if(error.name === "UnauthorizedError-noBooking") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if (error.name === "forbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { roomId } = req.body;
  const { userId } = req;

  const idUser = Number(userId);
  const idRoom = Number(roomId);

  if(isNaN(idUser)|| isNaN(idRoom)) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }

  try {
    const booked = await bookingService.bookSelectedRoom(idRoom, idUser);
    const bookedIdString= booked.id.toString();
    return res.status(httpStatus.OK).send(bookedIdString);
  } catch (error) {
    if (error.name === "forbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    if(error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}
