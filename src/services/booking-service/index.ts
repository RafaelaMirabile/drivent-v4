import { notFoundError, unauthorizedError, unauthorizedErrorNoBooking } from "@/errors";
import { forbiddenError } from "@/errors/forbidden-error";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketService from "../tickets-service";

async function checkEnrollmentAndTicket(idUser: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(idUser);

  if (!enrollment) {
    throw unauthorizedError();
  }
  const userticket = await ticketService.getTicketByUserId(idUser);
  if (userticket.TicketType.isRemote === true || userticket.status === "RESERVED") {
    throw forbiddenError();
  }
}

async function checkBookingByRoomId(idRoom: number) {
  const bookingsByIdRoom = await bookingRepository.findRoom(idRoom);
  if (!bookingsByIdRoom) {
    throw notFoundError();
  }
/*  NO PUT   const bookingsByUser = bookingsByIdRoom.Booking.filter(value => value.userId === idUser);

    if (bookingsByUser.length === 0) {
        throw notFoundError();
    }*/ 
}

async function checkRoomCapacity(idRoom: number) {
  const room = await bookingRepository.findRoom(idRoom);
  if(room.capacity === 0) {
    throw forbiddenError();
  }
}

async function getBookingByuserId(idUser: number) {
  await checkEnrollmentAndTicket(idUser);
  const booking = await bookingRepository.findBooking(idUser);
  if (!booking) {
    throw unauthorizedErrorNoBooking();
  }
  return booking;
}

async function bookSelectedRoom(idRoom: number, idUser: number) {
  await checkEnrollmentAndTicket(idUser);
  await checkBookingByRoomId(idRoom);
  await checkRoomCapacity(idRoom);
  const bookedRoom = await bookingRepository.createBookedRoom(idRoom, idUser);
  return bookedRoom;
}

const bookingService = {
  getBookingByuserId,
  bookSelectedRoom
};

export default bookingService;
