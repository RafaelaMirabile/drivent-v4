import { prisma } from "@/config";

export async function findBooking(idUser: number) {
  return await prisma.booking.findFirst({
    where: {
      userId: idUser
    },
    include: {
      Room: true
    }
  });
}

export async function createBookedRoom(idRoom: number, idUser: number) {
  return await prisma.booking.create({
    data: {
      userId: idUser,
      roomId: idRoom
    }
  });
}

export async function findRoom(idRoom: number) {
  return prisma.room.findFirst({
    where: {
      id: idRoom
    },
    include: {
      Booking: true
    }
  });
}

const bookingRepository = {
  findBooking,
  createBookedRoom,
  findRoom
};

export default bookingRepository;
