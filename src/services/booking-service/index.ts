import { notFoundError, unauthorizedError } from "@/errors";
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
async function checkBookingByRoomIdAndRoomCapacity(idRoom: number) {
  const bookingsByIdRoom = await bookingRepository.findRoom(idRoom);
  if (!bookingsByIdRoom) {
    throw notFoundError();
  }
  if (bookingsByIdRoom.capacity === 3 ) {
    throw forbiddenError();
  }
}
async function getBookingByuserId(idUser: number) {
  await checkEnrollmentAndTicket(idUser);
  const booking = await bookingRepository.findBooking(idUser);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}
async function bookSelectedRoom(idUser: number, idRoom: number) {
  await checkEnrollmentAndTicket(idUser);
  await checkBookingByRoomIdAndRoomCapacity(idRoom);
  const bookedRoom = await bookingRepository.createBookedRoom(idRoom, idUser);
  return bookedRoom;
}
async function changeBooking(idUser: number, idRoom: number, idBooking: number) {
  await checkEnrollmentAndTicket(idUser);
  await getBookingByuserId(idUser);
  await checkBookingByRoomIdAndRoomCapacity(idRoom);

  const update = await bookingRepository.updateBoking(idRoom, idBooking);
  return update;
}
const bookingService = {
  getBookingByuserId,
  bookSelectedRoom,
  changeBooking
};

export default bookingService;
