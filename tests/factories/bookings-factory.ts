import { prisma } from "@/config";
import faker from "@faker-js/faker";

export async function createBooking(idUser: number, idRoom: number) {
  return await prisma.booking.create({
    data: {
      userId: idUser,
      roomId: idRoom,
    }
  });
}

export async function findBookingWithWrongUserId(idUser: number, idRoom: number) {
  return await prisma.booking.findMany({
    where: {
      userId: (idUser+1)
    }
  });
}

export async function createRoomWIthNoCapacity(idHotel: number) {
  return await prisma.room.create({
    data: {
      name: faker.random.word(),
      capacity: 0,
      hotelId: idHotel
    }
  });
}
